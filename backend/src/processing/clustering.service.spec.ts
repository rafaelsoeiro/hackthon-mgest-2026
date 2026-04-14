import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClusteringService } from './clustering.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EmbeddingService } from '@/ai/embedding.service';
import {
  IncidentStatus,
  PriorityLevel,
  SystemCode,
  FeedbackType,
} from '@prisma/client';

describe('ClusteringService', () => {
  let service: ClusteringService;
  let prisma: any;
  let embeddingService: any;
  let events: EventEmitter2;

  const makePF = (overrides = {}) => ({
    id: 'pf-001',
    rawFeedbackId: 'rf-001',
    systemCode: SystemCode.GM_LOG,
    feedbackType: FeedbackType.INCIDENT,
    severityScore: 8.5,
    aiSummary: 'WMS CD01 fora de operação',
    keywordsFound: ['CD01', 'parou'],
    originalCategory: null,
    reclassified: false,
    scoreS: 8.5,
    scoreV: 3,
    scoreR: 2,
    scoreT: 7,
    scoreK: 10,
    priorityScore: 75,
    priorityLevel: PriorityLevel.CRITICAL,
    overrideApplied: false,
    overrideReason: null,
    embedding: null,
    incidentGroupId: null,
    processedAt: new Date(),
    updatedAt: new Date(),
    manualPriorityLevel: null,
    manualAdjustedBy: null,
    manualAdjustedAt: null,
    manualAdjustReason: null,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      $queryRawUnsafe: jest.fn(),
      $executeRawUnsafe: jest.fn(),
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
      incidentGroup: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      processedFeedback: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    embeddingService = {
      updateCentroid: jest.fn().mockReturnValue(new Array(384).fill(0.1)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClusteringService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmbeddingService, useValue: embeddingService },
        { provide: EventEmitter2, useValue: new EventEmitter2() },
      ],
    }).compile();

    service = module.get<ClusteringService>(ClusteringService);
    events = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('assignToGroup — new group creation', () => {
    it('should create a new IncidentGroup when no match found (without embedding)', async () => {
      prisma.incidentGroup.findFirst.mockResolvedValue(null);
      prisma.incidentGroup.create.mockResolvedValue({ id: 'ig-new' });

      const pf = makePF();
      const result = await service.assignToGroup(pf as any, null, new Date());

      expect(result).toBe('ig-new');
      expect(prisma.incidentGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            systemCode: 'GM_LOG',
            feedbackType: 'INCIDENT',
            feedbackCount: 1,
            status: IncidentStatus.OPEN,
          }),
        }),
      );
    });

    it('should create new group via raw SQL when embedding is provided', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([]); // vector search returns nothing
      prisma.incidentGroup.findFirst.mockResolvedValue(null); // no temporal match
      prisma.$queryRawUnsafe.mockResolvedValueOnce([{ id: 'ig-vec-new' }]); // insert

      const embedding = new Array(384).fill(0.5);
      const pf = makePF();
      const result = await service.assignToGroup(pf as any, embedding, new Date());

      expect(result).toBe('ig-vec-new');
    });
  });

  describe('assignToGroup — existing group match', () => {
    it('should match via vector similarity when distance < 0.15', async () => {
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { id: 'ig-existing', distance: 0.08 },
      ]);
      prisma.incidentGroup.findUnique.mockResolvedValue({
        id: 'ig-existing',
        feedbackCount: 5,
        firstSeenAt: new Date(Date.now() - 120 * 60_000), // 2 hours ago
      });
      prisma.incidentGroup.update.mockResolvedValue({});
      prisma.$queryRawUnsafe.mockResolvedValueOnce([]); // centroid recalc fetches
      prisma.$executeRawUnsafe.mockResolvedValue(null);

      const embedding = new Array(384).fill(0.5);
      const pf = makePF();
      const result = await service.assignToGroup(pf as any, embedding, new Date());

      expect(result).toBe('ig-existing');
    });

    it('should match via temporal window when no embedding', async () => {
      const existingGroup = {
        id: 'ig-temporal',
        feedbackCount: 3,
        lastSeenAt: new Date(Date.now() - 10 * 60_000), // 10 min ago
        firstSeenAt: new Date(Date.now() - 60 * 60_000),
        systemCode: 'GM_LOG',
        status: IncidentStatus.OPEN,
      };
      prisma.incidentGroup.findFirst.mockResolvedValue(existingGroup);
      prisma.incidentGroup.findUnique.mockResolvedValue(existingGroup);
      prisma.incidentGroup.update.mockResolvedValue({});

      const pf = makePF();
      const result = await service.assignToGroup(pf as any, null, new Date());

      expect(result).toBe('ig-temporal');
    });
  });

  describe('OR-06: feedbackCount >= 11 forces CRITICAL', () => {
    it('should force priorityLevel to CRITICAL when feedbackCount reaches 11', async () => {
      const existingGroup = {
        id: 'ig-high-count',
        feedbackCount: 10, // will become 11
        firstSeenAt: new Date(Date.now() - 120 * 60_000),
      };
      prisma.incidentGroup.findFirst.mockResolvedValue(existingGroup);
      prisma.incidentGroup.findUnique.mockResolvedValue(existingGroup);
      prisma.incidentGroup.update.mockResolvedValue({});

      const pf = makePF({ priorityLevel: PriorityLevel.MEDIUM, priorityScore: 40 });
      await service.assignToGroup(pf as any, null, new Date());

      expect(prisma.incidentGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priorityLevel: PriorityLevel.CRITICAL,
          }),
        }),
      );
    });

    it('should NOT force CRITICAL when feedbackCount < 11', async () => {
      const existingGroup = {
        id: 'ig-low-count',
        feedbackCount: 5, // will become 6
        firstSeenAt: new Date(Date.now() - 120 * 60_000),
      };
      prisma.incidentGroup.findFirst.mockResolvedValue(existingGroup);
      prisma.incidentGroup.findUnique.mockResolvedValue(existingGroup);
      prisma.incidentGroup.update.mockResolvedValue({});

      const pf = makePF({ priorityLevel: PriorityLevel.MEDIUM, priorityScore: 40 });
      await service.assignToGroup(pf as any, null, new Date());

      expect(prisma.incidentGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priorityLevel: PriorityLevel.MEDIUM,
          }),
        }),
      );
    });
  });

  describe('BN-07: burst pattern detection', () => {
    it('should emit pattern_detected when 5 feedbacks in 15 min', async () => {
      const emitSpy = jest.spyOn(events, 'emit');
      const existingGroup = {
        id: 'ig-burst',
        feedbackCount: 4, // becomes 5
        firstSeenAt: new Date(Date.now() - 10 * 60_000), // 10 min ago
      };
      prisma.incidentGroup.findFirst.mockResolvedValue(existingGroup);
      prisma.incidentGroup.findUnique.mockResolvedValue(existingGroup);
      prisma.incidentGroup.update.mockResolvedValue({});

      const pf = makePF();
      await service.assignToGroup(pf as any, null, new Date());

      expect(emitSpy).toHaveBeenCalledWith(
        'pattern_detected',
        expect.objectContaining({
          incidentGroupId: 'ig-burst',
          feedbackCount: 5,
          type: 'burst',
        }),
      );
    });

    it('should NOT emit pattern_detected when time > 15 min', async () => {
      const emitSpy = jest.spyOn(events, 'emit');
      const existingGroup = {
        id: 'ig-slow',
        feedbackCount: 4,
        firstSeenAt: new Date(Date.now() - 60 * 60_000), // 60 min ago
      };
      prisma.incidentGroup.findFirst.mockResolvedValue(existingGroup);
      prisma.incidentGroup.findUnique.mockResolvedValue(existingGroup);
      prisma.incidentGroup.update.mockResolvedValue({});

      const pf = makePF();
      await service.assignToGroup(pf as any, null, new Date());

      expect(emitSpy).not.toHaveBeenCalledWith(
        'pattern_detected',
        expect.anything(),
      );
    });
  });

  describe('feedbackCount limit (200)', () => {
    it('should create new derived group when feedbackCount >= 200', async () => {
      const fullGroup = {
        id: 'ig-full',
        feedbackCount: 200,
        firstSeenAt: new Date(),
      };
      prisma.incidentGroup.findFirst.mockResolvedValue(fullGroup);
      prisma.incidentGroup.findUnique.mockResolvedValue(fullGroup);
      prisma.incidentGroup.create.mockResolvedValue({ id: 'ig-derived' });

      const pf = makePF();
      const result = await service.assignToGroup(pf as any, null, new Date());

      expect(result).toBe('ig-derived');
      expect(prisma.incidentGroup.create).toHaveBeenCalled();
    });
  });
});

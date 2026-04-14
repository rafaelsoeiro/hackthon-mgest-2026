import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecurrenceService } from './recurrence.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SystemCode, IncidentStatus } from '@prisma/client';

describe('RecurrenceService', () => {
  let service: RecurrenceService;
  let prisma: any;
  let events: EventEmitter2;

  beforeEach(async () => {
    prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ count: 0n }]),
      incidentGroup: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      incidentOccurrence: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurrenceService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: new EventEmitter2() },
      ],
    }).compile();

    service = module.get<RecurrenceService>(RecurrenceService);
    events = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('getRecurrenceCount', () => {
    it('should return 0 when no resolved groups match', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ count: 0n }]);

      const count = await service.getRecurrenceCount(SystemCode.GM_LOG, null);

      expect(count).toBe(0);
    });

    it('should query vector similarity when embedding provided', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ count: 3n }]);
      const embedding = new Array(384).fill(0.5);

      const count = await service.getRecurrenceCount(SystemCode.GM_LOG, embedding);

      expect(count).toBe(3);
      // Verify the query includes vector distance check
      const query = prisma.$queryRawUnsafe.mock.calls[0][0];
      expect(query).toContain('<=>');
      expect(query).toContain('0.20');
    });

    it('should query by systemCode only when no embedding', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ count: 5n }]);

      const count = await service.getRecurrenceCount(SystemCode.GM_FIN, null);

      expect(count).toBe(5);
      const query = prisma.$queryRawUnsafe.mock.calls[0][0];
      expect(query).not.toContain('<=>');
    });

    it('should handle errors gracefully and return 0', async () => {
      prisma.$queryRawUnsafe.mockRejectedValue(new Error('DB error'));

      const count = await service.getRecurrenceCount(SystemCode.GM_LOG, null);

      expect(count).toBe(0);
    });
  });

  describe('registerOccurrence', () => {
    it('should create occurrence and update recurrenceCount', async () => {
      prisma.incidentGroup.findUnique.mockResolvedValue({
        id: 'ig-001',
        firstSeenAt: new Date('2026-04-01'),
        priorityScore: 85,
        systemCode: SystemCode.GM_LOG,
        title: 'WMS CD01 down',
        occurrences: [{ id: 'occ-1' }, { id: 'occ-2' }],
      });
      prisma.incidentOccurrence.create.mockResolvedValue({});
      prisma.incidentGroup.update.mockResolvedValue({});

      await service.registerOccurrence('ig-001');

      expect(prisma.incidentOccurrence.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          incidentGroupId: 'ig-001',
          scoreSnapshot: 85,
        }),
      });
      expect(prisma.incidentGroup.update).toHaveBeenCalledWith({
        where: { id: 'ig-001' },
        data: { recurrenceCount: 3 },
      });
    });

    it('should emit pattern_detected with suggestEpic when recurrenceCount >= 6', async () => {
      const emitSpy = jest.spyOn(events, 'emit');
      prisma.incidentGroup.findUnique.mockResolvedValue({
        id: 'ig-recurring',
        firstSeenAt: new Date(),
        priorityScore: 90,
        systemCode: SystemCode.GM_FIN,
        title: 'Nota fiscal com erro',
        occurrences: Array.from({ length: 5 }, (_, i) => ({ id: `occ-${i}` })),
      });
      prisma.incidentOccurrence.create.mockResolvedValue({});
      prisma.incidentGroup.update.mockResolvedValue({});

      await service.registerOccurrence('ig-recurring');

      expect(emitSpy).toHaveBeenCalledWith(
        'pattern_detected',
        expect.objectContaining({
          incidentGroupId: 'ig-recurring',
          recurrenceCount: 6,
          suggestEpic: true,
        }),
      );
    });

    it('should NOT emit pattern_detected when recurrenceCount < 6', async () => {
      const emitSpy = jest.spyOn(events, 'emit');
      prisma.incidentGroup.findUnique.mockResolvedValue({
        id: 'ig-low',
        firstSeenAt: new Date(),
        priorityScore: 50,
        systemCode: SystemCode.GM_CORE,
        title: 'Login lento',
        occurrences: [{ id: 'occ-1' }],
      });
      prisma.incidentOccurrence.create.mockResolvedValue({});
      prisma.incidentGroup.update.mockResolvedValue({});

      await service.registerOccurrence('ig-low');

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if group not found', async () => {
      prisma.incidentGroup.findUnique.mockResolvedValue(null);

      await service.registerOccurrence('non-existent');

      expect(prisma.incidentOccurrence.create).not.toHaveBeenCalled();
    });
  });
});

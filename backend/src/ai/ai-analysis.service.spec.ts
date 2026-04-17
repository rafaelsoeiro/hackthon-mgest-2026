import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIAnalysisService } from './ai-analysis.service';
import { PrismaService } from '@/prisma/prisma.service';
import { FeedbackChannel, FeedbackProcessingStatus, SystemCode } from '@prisma/client';

const mockRawFeedback = {
  id: 'test-id-001',
  channel: FeedbackChannel.WHATSAPP,
  externalId: null,
  sourceGroupId: 'group-log-01',
  sourceGroupName: 'Logística CD01',
  authorId: null,
  authorName: 'João Motorista',
  rawContent: 'O sistema WMS do CD01 parou de funcionar, caminhões parados na doca aguardando conferência',
  attachments: null,
  receivedAt: new Date('2026-04-14T03:30:00'),
  processingStatus: FeedbackProcessingStatus.PENDING,
  processingError: null,
  createdAt: new Date(),
};

const mockClaudeResponse = {
  systemCode: 'GM_LOG',
  feedbackType: 'INCIDENT',
  severityScore: 9.5,
  summary: 'WMS do CD01 fora de operação, caminhões parados na doca aguardando conferência',
  keywordsFound: ['CD01', 'caminhão', 'parou'],
  reclassificationReason: null,
};

describe('AIAnalysisService', () => {
  let service: AIAnalysisService;
  let prisma: { whatsAppGroup: any; keywordRule: any };
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    mockCreate = jest.fn();

    prisma = {
      whatsAppGroup: {
        findUnique: jest.fn().mockResolvedValue({
          groupId: 'group-log-01',
          systemHint: SystemCode.GM_LOG,
        }),
      },
      keywordRule: {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', pattern: 'parou', scoreK: 9, forceOverride: false, isActive: true },
          { id: '2', pattern: 'cd01', scoreK: 10, forceOverride: true, isActive: true },
          { id: '3', pattern: 'caminhão', scoreK: 8, forceOverride: false, isActive: true },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAnalysisService,
        { provide: ConfigService, useValue: { get: () => 'sk-ant-test-key' } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AIAnalysisService>(AIAnalysisService);

    // Mock the Anthropic client
    (service as any).client = {
      messages: { create: mockCreate },
    };
  });

  it('should return valid AIAnalysisResult for pt-BR text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse) }],
    });

    const result = await service.analyze(mockRawFeedback);

    expect(result.systemCode).toBe('GM_LOG');
    expect(result.feedbackType).toBe('INCIDENT');
    expect(result.severityScore).toBeGreaterThanOrEqual(0);
    expect(result.severityScore).toBeLessThanOrEqual(10);
    expect(result.summary).toBeTruthy();
    expect(Array.isArray(result.keywordsFound)).toBe(true);
    expect(typeof result.reclassified).toBe('boolean');
  });

  it('should retry with temperature=0.1 if first parse fails', async () => {
    // First call returns invalid JSON, second returns valid
    mockCreate
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: 'invalid json{{{' }],
      })
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse) }],
      });

    const result = await service.analyze(mockRawFeedback);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.systemCode).toBe('GM_LOG');
    // Second call should use temperature=0.1
    expect(mockCreate.mock.calls[1][0].temperature).toBe(0.1);
  });

  it('should use fallback when Claude API is unavailable (timeout)', async () => {
    mockCreate.mockImplementation(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AbortError: timeout')), 50),
      ),
    );

    const result = await service.analyze(mockRawFeedback);

    expect(result.summary).toMatch(/^\[Fallback\]/);
    expect(result.feedbackType).toBe('INCIDENT');
    expect(result.reclassified).toBe(false);
  });

  it('should use fallback when Claude throws an error', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

    const result = await service.analyze(mockRawFeedback);

    expect(result.summary).toMatch(/^\[Fallback\]/);
    expect(result.systemCode).toBe('GM_LOG'); // from WhatsApp group systemHint
  });

  it('should set reclassified=true when reclassificationReason is present', async () => {
    const withReclassification = {
      ...mockClaudeResponse,
      systemCode: 'GM_OTHER',
      reclassificationReason: 'Não se encaixa claramente, mais próximo de GM_LOG',
    };
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(withReclassification) }],
    });

    const result = await service.analyze(mockRawFeedback);

    expect(result.reclassified).toBe(true);
    expect(result.reclassificationReason).toBeTruthy();
  });

  describe('retry with exponential backoff for 429/5xx', () => {
    beforeEach(() => {
      // Zero delays for fast tests
      (service as any).retryDelays = [0, 0, 0];
    });

    it('should retry on 429 and succeed on third attempt', async () => {
      const error429 = Object.assign(new Error('Rate limit exceeded'), { status: 429 });

      mockCreate
        .mockRejectedValueOnce(error429)
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse) }],
        });

      const result = await service.analyze(mockRawFeedback);

      expect(mockCreate).toHaveBeenCalledTimes(3);
      expect(result.systemCode).toBe('GM_LOG');
      expect(result.feedbackType).toBe('INCIDENT');
    });

    it('should retry on 5xx errors and succeed', async () => {
      const error500 = Object.assign(new Error('Internal server error'), { status: 500 });

      mockCreate
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse) }],
        });

      const result = await service.analyze(mockRawFeedback);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.systemCode).toBe('GM_LOG');
    });

    it('should fallback after exhausting all retry attempts on 429', async () => {
      const error429 = Object.assign(new Error('Rate limit exceeded'), { status: 429 });
      mockCreate.mockRejectedValue(error429);

      const result = await service.analyze(mockRawFeedback);

      // 1 initial + 3 retries = 4 total calls
      expect(mockCreate).toHaveBeenCalledTimes(4);
      expect(result.summary).toMatch(/^\[Fallback\]/);
      expect(result.feedbackType).toBe('INCIDENT');
    });

    it('should not retry on non-retryable errors (e.g. 400)', async () => {
      const error400 = Object.assign(new Error('Bad request'), { status: 400 });
      mockCreate.mockRejectedValue(error400);

      const result = await service.analyze(mockRawFeedback);

      // temperature=0 fails → temperature=0.1 fails → fallback (no 429 retries)
      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.summary).toMatch(/^\[Fallback\]/);
    });
  });

  describe('fallbackAnalysis', () => {
    it('should use systemHint from WhatsApp group', async () => {
      const result = await service.fallbackAnalysis(mockRawFeedback);

      expect(result.systemCode).toBe('GM_LOG');
      expect(prisma.whatsAppGroup.findUnique).toHaveBeenCalledWith({
        where: { groupId: 'group-log-01' },
      });
    });

    it('should detect keywords and use max scoreK as severity', async () => {
      const result = await service.fallbackAnalysis(mockRawFeedback);

      expect(result.keywordsFound).toContain('parou');
      expect(result.severityScore).toBeGreaterThanOrEqual(8);
    });

    it('should default to GM_OTHER when no group hint', async () => {
      const noGroup = { ...mockRawFeedback, sourceGroupId: null };
      const result = await service.fallbackAnalysis(noGroup);

      expect(result.systemCode).toBe('GM_OTHER');
    });
  });
});

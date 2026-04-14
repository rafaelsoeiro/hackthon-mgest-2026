import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service.js';
import { AIAnalysisService } from '@/ai/ai-analysis.service.js';
import { EmbeddingService } from '@/ai/embedding.service.js';
import { PriorityScoreService } from '@/priority-score/priority-score.service.js';
import { RecurrenceService } from './recurrence.service.js';
import { ClusteringService } from './clustering.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ProcessingJobData {
  rawFeedbackId: string;
}

@Processor('wa-ingestion', { concurrency: 3 })
export class WaProcessingWorker extends WorkerHost {
  private readonly logger = new Logger('ProcessingWorker:wa');

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAnalysis: AIAnalysisService,
    private readonly embedding: EmbeddingService,
    private readonly priorityScore: PriorityScoreService,
    private readonly recurrence: RecurrenceService,
    private readonly clustering: ClusteringService,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<ProcessingJobData>): Promise<void> {
    await processFeedback(
      job,
      this.logger,
      this.prisma,
      this.aiAnalysis,
      this.embedding,
      this.priorityScore,
      this.recurrence,
      this.clustering,
      this.events,
    );
  }
}

@Processor('jira-ingestion', { concurrency: 3 })
export class JiraProcessingWorker extends WorkerHost {
  private readonly logger = new Logger('ProcessingWorker:jira');

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAnalysis: AIAnalysisService,
    private readonly embedding: EmbeddingService,
    private readonly priorityScore: PriorityScoreService,
    private readonly recurrence: RecurrenceService,
    private readonly clustering: ClusteringService,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<ProcessingJobData>): Promise<void> {
    await processFeedback(
      job,
      this.logger,
      this.prisma,
      this.aiAnalysis,
      this.embedding,
      this.priorityScore,
      this.recurrence,
      this.clustering,
      this.events,
    );
  }
}

async function processFeedback(
  job: Job<ProcessingJobData>,
  logger: Logger,
  prisma: PrismaService,
  aiAnalysis: AIAnalysisService,
  embeddingService: EmbeddingService,
  priorityScoreService: PriorityScoreService,
  recurrenceService: RecurrenceService,
  clusteringService: ClusteringService,
  events: EventEmitter2,
): Promise<void> {
  const { rawFeedbackId } = job.data;
  logger.log(`Processando feedback ${rawFeedbackId} (job ${job.id})`);

  // Carregar RawFeedback
  const rawFeedback = await prisma.rawFeedback.findUnique({
    where: { id: rawFeedbackId },
  });

  if (!rawFeedback) {
    logger.error(`RawFeedback ${rawFeedbackId} não encontrado`);
    return;
  }

  // Marcar como PROCESSING
  await prisma.rawFeedback.update({
    where: { id: rawFeedbackId },
    data: { processingStatus: 'PROCESSING' },
  });

  try {
    // Step 1 — AI Analysis
    let analysis;
    try {
      analysis = await aiAnalysis.analyze(rawFeedback);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Step 1 falhou para ${rawFeedbackId}: ${errorMsg}`);
      await prisma.rawFeedback.update({
        where: { id: rawFeedbackId },
        data: {
          processingStatus: 'FAILED',
          processingError: `AI Analysis failed: ${errorMsg}`,
        },
      });
      throw err; // BullMQ tratará como dead-letter após tentativas
    }

    // Step 2 — Embedding (falha não bloqueia pipeline)
    let embeddingVector: number[] | null = null;
    try {
      embeddingVector = await embeddingService.generateEmbedding(
        rawFeedback.rawContent,
      );
    } catch (err) {
      logger.warn(
        `Step 2 embedding falhou (continuando): ${err instanceof Error ? err.message : err}`,
      );
    }

    // Step 3 — Recurrence
    const recurrenceCount30d = await recurrenceService.getRecurrenceCount(
      analysis.systemCode as any,
      embeddingVector,
    );

    // Step 4 — Priority Score
    const psResult = await priorityScoreService.calculate({
      severityScore: analysis.severityScore,
      feedbackCount: 1,
      windowMinutes: 60,
      recurrenceCount30d,
      receivedAt: rawFeedback.receivedAt,
      text: rawFeedback.rawContent,
      feedbacksInCluster: 1,
    });

    // Step 5 — Persist ProcessedFeedback
    let processedFeedback;
    if (embeddingVector) {
      const vectorStr = `[${embeddingVector.join(',')}]`;
      const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO processed_feedbacks (
           id, raw_feedback_id, "systemCode", "feedbackType", "severityScore",
           "aiSummary", "keywordsFound", "originalCategory", reclassified,
           "scoreS", "scoreV", "scoreR", "scoreT", "scoreK",
           "priorityScore", "priorityLevel", "overrideApplied", "overrideReason",
           embedding, "processedAt", updated_at
         ) VALUES (
           gen_random_uuid(), $1, $2, $3, $4,
           $5, $6, $7, $8,
           $9, $10, $11, $12, $13,
           $14, $15, $16, $17,
           $18::vector, NOW(), NOW()
         ) RETURNING id`,
        rawFeedbackId,
        analysis.systemCode,
        analysis.feedbackType,
        analysis.severityScore,
        analysis.summary,
        analysis.keywordsFound,
        null,
        analysis.reclassified,
        psResult.S,
        psResult.V,
        psResult.R,
        psResult.T,
        psResult.K,
        psResult.priorityScore,
        psResult.priorityLevel,
        psResult.overrideApplied,
        psResult.overrideReason,
        vectorStr,
      );

      processedFeedback = await prisma.processedFeedback.findUnique({
        where: { id: rows[0].id },
      });
    } else {
      processedFeedback = await prisma.processedFeedback.create({
        data: {
          rawFeedbackId,
          systemCode: analysis.systemCode as any,
          feedbackType: analysis.feedbackType as any,
          severityScore: analysis.severityScore,
          aiSummary: analysis.summary,
          keywordsFound: analysis.keywordsFound,
          originalCategory: null,
          reclassified: analysis.reclassified,
          scoreS: psResult.S,
          scoreV: psResult.V,
          scoreR: psResult.R,
          scoreT: psResult.T,
          scoreK: psResult.K,
          priorityScore: psResult.priorityScore,
          priorityLevel: psResult.priorityLevel as any,
          overrideApplied: psResult.overrideApplied,
          overrideReason: psResult.overrideReason,
          processedAt: new Date(),
        },
      });
    }

    if (!processedFeedback) {
      throw new Error(`Failed to create ProcessedFeedback for ${rawFeedbackId}`);
    }

    // Step 6 — Clustering (falha não perde o feedback)
    let incidentGroupId: string | null = null;
    try {
      incidentGroupId = await clusteringService.assignToGroup(
        processedFeedback,
        embeddingVector,
        rawFeedback.receivedAt,
      );
    } catch (err) {
      logger.warn(
        `Step 6 clustering falhou (feedback preservado): ${err instanceof Error ? err.message : err}`,
      );
    }

    // Step 7 — Update ProcessedFeedback com incidentGroupId
    if (incidentGroupId) {
      try {
        await prisma.processedFeedback.update({
          where: { id: processedFeedback.id },
          data: { incidentGroupId },
        });
      } catch (err) {
        logger.warn(
          `Step 7 update groupId falhou (feedback preservado): ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    // Step 8 — SSE (placeholder para EventsService da Etapa 12)
    try {
      events.emit('feedback_processed', {
        rawFeedbackId,
        processedFeedbackId: processedFeedback.id,
        incidentGroupId,
        systemCode: analysis.systemCode,
        priorityLevel: psResult.priorityLevel,
        priorityScore: psResult.priorityScore,
      });
    } catch {
      // EventsService placeholder — não bloqueia pipeline
    }

    // Marcar como PROCESSED
    await prisma.rawFeedback.update({
      where: { id: rawFeedbackId },
      data: { processingStatus: 'PROCESSED' },
    });

    logger.log(
      `Feedback ${rawFeedbackId} processado com sucesso → PS=${psResult.priorityScore} [${psResult.priorityLevel}]`,
    );
  } catch (err) {
    // Se não foi marcado como FAILED no Step 1, marcar agora
    const current = await prisma.rawFeedback.findUnique({
      where: { id: rawFeedbackId },
      select: { processingStatus: true },
    });
    if (current?.processingStatus !== 'FAILED') {
      await prisma.rawFeedback.update({
        where: { id: rawFeedbackId },
        data: {
          processingStatus: 'FAILED',
          processingError: err instanceof Error ? err.message : String(err),
        },
      });
    }
    throw err;
  }
}

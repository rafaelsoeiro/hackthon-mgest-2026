import {
  Controller,
  Get,
  Post,
  Param,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('api/v1/processing')
export class ProcessingController {
  private readonly logger = new Logger(ProcessingController.name);

  constructor(
    @InjectQueue('wa-ingestion') private readonly waQueue: Queue,
    @InjectQueue('jira-ingestion') private readonly jiraQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Get('queue')
  async getQueueStatus() {
    const [waCounts, jiraCounts] = await Promise.all([
      this.waQueue.getJobCounts('waiting', 'active', 'failed', 'completed'),
      this.jiraQueue.getJobCounts('waiting', 'active', 'failed', 'completed'),
    ]);

    const oneHourAgo = new Date(Date.now() - 60 * 60_000);
    const processedLastHour = await this.prisma.rawFeedback.count({
      where: {
        processingStatus: 'PROCESSED',
        createdAt: { gte: oneHourAgo },
      },
    });

    return {
      pending: (waCounts.waiting ?? 0) + (jiraCounts.waiting ?? 0),
      processing: (waCounts.active ?? 0) + (jiraCounts.active ?? 0),
      failed: (waCounts.failed ?? 0) + (jiraCounts.failed ?? 0),
      processed_last_hour: processedLastHour,
    };
  }

  @Post('reprocess/:rawFeedbackId')
  async reprocess(@Param('rawFeedbackId') rawFeedbackId: string) {
    const rawFeedback = await this.prisma.rawFeedback.findUnique({
      where: { id: rawFeedbackId },
    });

    if (!rawFeedback) {
      throw new NotFoundException(
        `RawFeedback ${rawFeedbackId} não encontrado`,
      );
    }

    if (rawFeedback.processingStatus !== 'FAILED') {
      throw new BadRequestException(
        `Apenas feedbacks com status FAILED podem ser reprocessados. Status atual: ${rawFeedback.processingStatus}`,
      );
    }

    // Verificar tentativas anteriores (max 3)
    const existingJobs = await this.waQueue.getJobs(['failed', 'completed']);
    const jiraJobs = await this.jiraQueue.getJobs(['failed', 'completed']);
    const allJobs = [...existingJobs, ...jiraJobs];
    const previousAttempts = allJobs.filter(
      (j) => j.data?.rawFeedbackId === rawFeedbackId,
    ).length;

    if (previousAttempts >= 3) {
      throw new BadRequestException(
        `RawFeedback ${rawFeedbackId} já atingiu o limite de 3 tentativas`,
      );
    }

    // Resetar status
    await this.prisma.rawFeedback.update({
      where: { id: rawFeedbackId },
      data: { processingStatus: 'PENDING', processingError: null },
    });

    // Limpar ProcessedFeedback anterior se existir
    await this.prisma.processedFeedback.deleteMany({
      where: { rawFeedbackId },
    });

    // Re-enfileirar baseado no canal
    const queue =
      rawFeedback.channel === 'WHATSAPP' ? this.waQueue : this.jiraQueue;

    const job = await queue.add('process-feedback', { rawFeedbackId });

    this.logger.log(
      `Reprocessando feedback ${rawFeedbackId} (job ${job.id}, tentativa ${previousAttempts + 1}/3)`,
    );

    return {
      message: 'Feedback re-enfileirado para processamento',
      jobId: job.id,
      attempt: previousAttempts + 1,
      maxAttempts: 3,
    };
  }
}

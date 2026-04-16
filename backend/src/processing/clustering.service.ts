import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service.js';
import { EmbeddingService } from '@/ai/embedding.service.js';
import { ProcessedFeedback, IncidentStatus, PriorityLevel } from '@prisma/client';
import { mapPriorityLevel } from '@/priority-score/priority-score.calculator.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface NearestGroup {
  id: string;
  distance: number;
}

@Injectable()
export class ClusteringService {
  private readonly logger = new Logger(ClusteringService.name);
  private static readonly VECTOR_THRESHOLD = 0.15;
  private static readonly TEMPORAL_WINDOW_MIN = 30;
  private static readonly MAX_GROUP_SIZE = 200;
  private static readonly CRITICAL_THRESHOLD = 11;
  private static readonly BURST_COUNT = 5;
  private static readonly BURST_WINDOW_MIN = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly events: EventEmitter2,
  ) {}

  async assignToGroup(
    pf: ProcessedFeedback,
    embedding: number[] | null,
    receivedAt: Date,
  ): Promise<string> {
    let groupId: string | null = null;

    if (embedding) {
      groupId = await this.findGroupByVector(embedding, pf.systemCode);
    }

    if (!groupId) {
      groupId = await this.findGroupByTemporal(pf.systemCode);
    }

    if (groupId) {
      return this.updateExistingGroup(groupId, pf, embedding);
    }

    return this.createNewGroup(pf, embedding, receivedAt);
  }

  private async findGroupByVector(
    embedding: number[],
    systemCode: string,
  ): Promise<string | null> {
    try {
      const vectorStr = `[${embedding.join(',')}]`;
      const rows = await this.prisma.$queryRawUnsafe<NearestGroup[]>(
        `SELECT id, "centroidEmbedding" <=> $1::vector AS distance
         FROM incident_groups
         WHERE "systemCode" = $2
           AND status IN ('OPEN', 'IN_PROGRESS')
           AND "lastSeenAt" > NOW() - INTERVAL '4 hours'
         ORDER BY distance ASC
         LIMIT 1`,
        vectorStr,
        systemCode,
      );

      if (rows.length > 0 && rows[0].distance < ClusteringService.VECTOR_THRESHOLD) {
        return rows[0].id;
      }
    } catch (err) {
      this.logger.warn(
        `Erro na busca vetorial: ${err instanceof Error ? err.message : err}`,
      );
    }
    return null;
  }

  private async findGroupByTemporal(systemCode: string): Promise<string | null> {
    const group = await this.prisma.incidentGroup.findFirst({
      where: {
        systemCode: systemCode as any,
        status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
        lastSeenAt: {
          gt: new Date(Date.now() - ClusteringService.TEMPORAL_WINDOW_MIN * 60_000),
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
    return group?.id ?? null;
  }

  private async updateExistingGroup(
    groupId: string,
    pf: ProcessedFeedback,
    embedding: number[] | null,
  ): Promise<string> {
    const group = await this.prisma.incidentGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) return this.createNewGroup(pf, embedding, pf.processedAt);

    // Limite de grupo: criar derivado se >= 200
    if (group.feedbackCount >= ClusteringService.MAX_GROUP_SIZE) {
      this.logger.log(
        `Grupo ${groupId} atingiu limite de ${ClusteringService.MAX_GROUP_SIZE} feedbacks, criando derivado`,
      );
      return this.createNewGroup(pf, embedding, pf.processedAt);
    }

    const newCount = group.feedbackCount + 1;
    let newPriorityLevel = mapPriorityLevel(pf.priorityScore) as PriorityLevel;

    // OR-06: feedbackCount >= 11 → forçar CRITICAL
    if (newCount >= ClusteringService.CRITICAL_THRESHOLD) {
      newPriorityLevel = PriorityLevel.CRITICAL;
    }

    // Recalcular centróide se embedding disponível
    let centroidUpdate = {};
    if (embedding) {
      centroidUpdate = await this.recalculateCentroid(groupId, embedding);
    }

    await this.prisma.$transaction([
      this.prisma.incidentGroup.update({
        where: { id: groupId },
        data: {
          feedbackCount: { increment: 1 },
          lastSeenAt: new Date(),
          priorityScore: pf.priorityScore,
          priorityLevel: newPriorityLevel,
          ...centroidUpdate,
        },
      }),
    ]);

    // BN-07: Detecção de padrão burst
    await this.checkBurstPattern(groupId, newCount, group.firstSeenAt);

    return groupId;
  }

  private async createNewGroup(
    pf: ProcessedFeedback,
    embedding: number[] | null,
    receivedAt: Date,
  ): Promise<string> {
    const embeddingData = embedding
      ? { centroidEmbedding: embedding }
      : {};

    // Para pgvector, precisamos usar raw query se embedding presente
    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO incident_groups (
           id, title, "systemCode", "feedbackType", "priorityScore", "priorityLevel",
           status, "feedbackCount", "recurrenceCount", "firstSeenAt", "lastSeenAt",
           "centroidEmbedding", created_at, updated_at
         ) VALUES (
           gen_random_uuid(), $1, $2, $3, $4, $5,
           'OPEN', 1, 0, $6, $6,
           $7::vector, NOW(), NOW()
         ) RETURNING id`,
        pf.aiSummary.substring(0, 80),
        pf.systemCode,
        pf.feedbackType,
        pf.priorityScore,
        pf.priorityLevel,
        receivedAt,
        vectorStr,
      );
      return rows[0].id;
    }

    const group = await this.prisma.incidentGroup.create({
      data: {
        title: pf.aiSummary.substring(0, 80),
        systemCode: pf.systemCode,
        feedbackType: pf.feedbackType,
        priorityScore: pf.priorityScore,
        priorityLevel: pf.priorityLevel,
        status: IncidentStatus.OPEN,
        feedbackCount: 1,
        recurrenceCount: 0,
        firstSeenAt: receivedAt,
        lastSeenAt: receivedAt,
      },
    });

    return group.id;
  }

  private async recalculateCentroid(
    groupId: string,
    newEmbedding: number[],
  ): Promise<Record<string, never>> {
    try {
      // Incremental centroid update: new_centroid = (old_centroid * n + new_embedding) / (n + 1)
      // This avoids fetching ALL embeddings from the group (O(n) → O(1))
      await this.prisma.$executeRawUnsafe(
        `UPDATE incident_groups
         SET "centroidEmbedding" = (
           CASE
             WHEN "centroidEmbedding" IS NULL THEN $1::vector
             ELSE (
               ("centroidEmbedding" * "feedbackCount"::float + $1::vector) /
               ("feedbackCount"::float + 1)
             )
           END
         )
         WHERE id = $2`,
        `[${newEmbedding.join(',')}]`,
        groupId,
      );
    } catch (err) {
      this.logger.warn(
        `Erro ao recalcular centróide do grupo ${groupId}: ${err instanceof Error ? err.message : err}`,
      );
    }

    return {} as Record<string, never>;
  }

  private async checkBurstPattern(
    groupId: string,
    feedbackCount: number,
    firstSeenAt: Date,
  ): Promise<void> {
    if (feedbackCount !== ClusteringService.BURST_COUNT) return;

    const elapsedMs = Date.now() - firstSeenAt.getTime();
    const elapsedMin = elapsedMs / 60_000;

    if (elapsedMin <= ClusteringService.BURST_WINDOW_MIN) {
      this.logger.warn(
        `BN-07: Grupo ${groupId} atingiu ${feedbackCount} feedbacks em ${Math.round(elapsedMin)} minutos`,
      );
      this.events.emit('pattern_detected', {
        incidentGroupId: groupId,
        feedbackCount,
        elapsedMinutes: Math.round(elapsedMin),
        type: 'burst',
        suggestEpic: false,
      });
    }
  }
}

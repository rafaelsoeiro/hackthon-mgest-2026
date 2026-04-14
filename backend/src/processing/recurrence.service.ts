import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service.js';
import { SystemCode, FeedbackType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RecurrenceService {
  private readonly logger = new Logger(RecurrenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async getRecurrenceCount(
    systemCode: SystemCode,
    embedding: number[] | null,
  ): Promise<number> {
    try {
      if (embedding) {
        const vectorStr = `[${embedding.join(',')}]`;
        const rows = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(io.id)::bigint AS count
           FROM incident_occurrences io
           JOIN incident_groups ig ON ig.id = io.incident_group_id
           WHERE ig."systemCode" = $1
             AND ig.status = 'RESOLVED'
             AND ig."resolvedAt" > NOW() - INTERVAL '30 days'
             AND ig."centroidEmbedding" IS NOT NULL
             AND (ig."centroidEmbedding" <=> $2::vector) < 0.20
          `,
          systemCode,
          vectorStr,
        );
        return Number(rows[0]?.count ?? 0);
      }

      // Sem embedding: filtrar só por systemCode
      const rows = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(io.id)::bigint AS count
         FROM incident_occurrences io
         JOIN incident_groups ig ON ig.id = io.incident_group_id
         WHERE ig."systemCode" = $1
           AND ig.status = 'RESOLVED'
           AND ig."resolvedAt" > NOW() - INTERVAL '30 days'
        `,
        systemCode,
      );
      return Number(rows[0]?.count ?? 0);
    } catch (err) {
      this.logger.warn(
        `Erro ao buscar recorrência: ${err instanceof Error ? err.message : err}`,
      );
      return 0;
    }
  }

  async registerOccurrence(incidentGroupId: string): Promise<void> {
    const group = await this.prisma.incidentGroup.findUnique({
      where: { id: incidentGroupId },
      include: { occurrences: { select: { id: true } } },
    });
    if (!group) return;

    await this.prisma.incidentOccurrence.create({
      data: {
        incidentGroupId: group.id,
        occurredAt: group.firstSeenAt,
        scoreSnapshot: group.priorityScore,
      },
    });

    const recurrenceCount = group.occurrences.length + 1;

    await this.prisma.incidentGroup.update({
      where: { id: group.id },
      data: { recurrenceCount },
    });

    if (recurrenceCount >= 6) {
      this.logger.warn(
        `Padrão detectado: grupo ${group.id} tem ${recurrenceCount} recorrências. Sugerindo criação de Epic.`,
      );
      this.events.emit('pattern_detected', {
        incidentGroupId: group.id,
        recurrenceCount,
        suggestEpic: true,
        systemCode: group.systemCode,
        title: group.title,
      });
    }
  }
}

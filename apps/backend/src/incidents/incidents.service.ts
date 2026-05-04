import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemCode, Prisma } from '@prisma/client';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    system?: string;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.IncidentGroupWhereInput = {};

    if (filters.system && filters.system !== 'ALL') {
      where.systemCode = filters.system as SystemCode;
    }
    if (filters.status) {
      where.status = filters.status as any;
    }

    let orderBy: Prisma.IncidentGroupOrderByWithRelationInput = {
      priorityScore: 'desc',
    };
    if (filters.sort === 'volume') {
      orderBy = { feedbackCount: 'desc' };
    } else if (filters.sort === 'date') {
      orderBy = { lastSeenAt: 'desc' };
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const [data, total] = await Promise.all([
      this.prisma.incidentGroup.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          feedbacks: {
            select: {
              id: true,
              rawFeedback: { select: { channel: true } },
            },
          },
        },
      }),
      this.prisma.incidentGroup.count({ where }),
    ]);

    return {
      data: data.map((ig) => this.mapIncidentGroup(ig)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const ig = await this.prisma.incidentGroup.findUnique({
      where: { id },
      include: {
        feedbacks: {
          include: {
            rawFeedback: true,
          },
        },
        occurrences: {
          orderBy: { occurredAt: 'asc' },
        },
      },
    });

    if (!ig) throw new NotFoundException(`Incident ${id} not found`);

    const feedbacks = ig.feedbacks.map((pf) => ({
      id: pf.id,
      source: pf.rawFeedback.channel,
      groupName: pf.rawFeedback.sourceGroupName ?? '',
      rawText: pf.rawFeedback.rawContent,
      aiSeverityScore: pf.severityScore,
      aiSystemCode: pf.systemCode,
      priorityScore: pf.priorityScore,
      priorityLevel: pf.priorityLevel,
      wasRecategorized: pf.reclassified,
      receivedAt: pf.rawFeedback.receivedAt.toISOString(),
      clusterId: ig.id,
      jiraKey: null,
      jiraUrl: null,
    }));

    return {
      ...this.mapIncidentGroup(ig),
      feedbacks,
      occurrences: ig.occurrences.map((o) => ({
        id: o.id,
        occurredAt: o.occurredAt.toISOString(),
        resolvedAt: o.resolvedAt?.toISOString() ?? null,
        scoreSnapshot: o.scoreSnapshot,
      })),
    };
  }

  async findProblems() {
    const problems = await this.prisma.incidentGroup.findMany({
      where: {
        status: { in: ['ROOT_CAUSE_IDENTIFIED', 'EPIC_CREATED'] },
      },
      include: {
        occurrences: {
          orderBy: { occurredAt: 'asc' },
        },
      },
      orderBy: { recurrenceCount: 'desc' },
    });

    return problems.map((ig) => ({
      id: ig.id,
      title: ig.title,
      systemCode: ig.systemCode,
      occurrenceCount: ig.recurrenceCount,
      firstOccurredAt: ig.firstSeenAt.toISOString(),
      lastOccurredAt: ig.lastSeenAt.toISOString(),
      status: ig.status,
      squadOwner: 'Nao atribuido',
      jiraEpicUrl: ig.epicJiraKey
        ? `https://mateus.atlassian.net/browse/${ig.epicJiraKey}`
        : null,
      jiraEpicKey: ig.epicJiraKey ?? null,
      avgDaysBetweenOccurrences: this.calcAvgDaysBetween(ig.occurrences),
      estimatedCostPerOccurrenceHours: 0,
      recurrenceSeries: ig.occurrences.map((o) => ({
        date: o.occurredAt.toISOString().split('T')[0],
        count: Math.round(o.scoreSnapshot),
      })),
    }));
  }

  async applyOverride(
    id: string,
    body: { priorityLevel: string; reason: string; adjustedBy: string },
  ) {
    const ig = await this.prisma.incidentGroup.findUnique({
      where: { id },
      include: { feedbacks: { select: { id: true } } },
    });
    if (!ig) throw new NotFoundException(`Incident ${id} not found`);

    await this.prisma.incidentGroup.update({
      where: { id },
      data: {
        priorityLevel: body.priorityLevel as any,
        status: ig.status,
      },
    });

    if (ig.feedbacks.length > 0) {
      await this.prisma.processedFeedback.updateMany({
        where: { incidentGroupId: id },
        data: {
          manualPriorityLevel: body.priorityLevel as any,
          manualAdjustedBy: body.adjustedBy,
          manualAdjustedAt: new Date(),
          manualAdjustReason: body.reason,
          overrideApplied: true,
        },
      });
    }

    return { success: true };
  }

  private mapIncidentGroup(ig: any) {
    const sources = new Set<string>();
    if (ig.feedbacks) {
      for (const f of ig.feedbacks) {
        const channel = f.rawFeedback?.channel ?? f.channel;
        if (channel) sources.add(channel);
      }
    }

    const avgScores = this.calcAvgScores(ig.feedbacks);

    return {
      id: ig.id,
      title: ig.title,
      systemCode: ig.systemCode,
      categoryL1: ig.feedbackType,
      categoryL2: '',
      categoryL3: '',
      status: ig.status,
      aggregatePriorityScore: ig.priorityScore,
      priorityLevel: ig.priorityLevel,
      feedbackCount: ig.feedbackCount,
      uniqueGroupCount: ig.feedbackCount,
      scoreS: avgScores.scoreS,
      scoreV: avgScores.scoreV,
      scoreR: avgScores.scoreR,
      scoreT: avgScores.scoreT,
      scoreK: avgScores.scoreK,
      overrideApplied: false,
      firstSeenAt: ig.firstSeenAt.toISOString(),
      lastSeenAt: ig.lastSeenAt.toISOString(),
      summary: ig.rootCauseSummary ?? ig.title,
      sources: [...sources],
      jiraKey: ig.epicJiraKey ?? null,
      jiraUrl: ig.epicJiraKey
        ? `https://mateus.atlassian.net/browse/${ig.epicJiraKey}`
        : null,
    };
  }

  private calcAvgScores(feedbacks: any[]) {
    if (!feedbacks?.length) {
      return { scoreS: 0, scoreV: 0, scoreR: 0, scoreT: 0, scoreK: 0 };
    }
    const pfs = feedbacks.filter((f: any) => f.scoreS != null);
    if (!pfs.length) {
      return { scoreS: 0, scoreV: 0, scoreR: 0, scoreT: 0, scoreK: 0 };
    }
    const avg = (key: string) =>
      Math.round(
        (pfs.reduce((sum: number, f: any) => sum + (f[key] ?? 0), 0) /
          pfs.length) *
          10,
      ) / 10;
    return {
      scoreS: avg('scoreS'),
      scoreV: avg('scoreV'),
      scoreR: avg('scoreR'),
      scoreT: avg('scoreT'),
      scoreK: avg('scoreK'),
    };
  }

  private calcAvgDaysBetween(occurrences: { occurredAt: Date }[]): number {
    if (occurrences.length < 2) return 0;
    const sorted = [...occurrences].sort(
      (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
    );
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalDays +=
        (sorted[i].occurredAt.getTime() - sorted[i - 1].occurredAt.getTime()) /
        (1000 * 60 * 60 * 24);
    }
    return Math.round((totalDays / (sorted.length - 1)) * 10) / 10;
  }
}

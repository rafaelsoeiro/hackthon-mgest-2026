import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemCode, PriorityLevel, IncidentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(period: '24h' | '7d' | '30d') {
    const since = this.periodToDate(period);

    const [
      incidentsByPriority,
      feedbackCount,
      recategorizedCount,
      whatsappGroupCount,
      jiraTicketCount,
      avgResponseTime,
    ] = await Promise.all([
      this.prisma.incidentGroup.groupBy({
        by: ['priorityLevel'],
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        _count: true,
      }),
      this.prisma.rawFeedback.count({
        where: { receivedAt: { gte: since } },
      }),
      this.prisma.processedFeedback.count({
        where: { reclassified: true, processedAt: { gte: since } },
      }),
      this.prisma.whatsAppGroup.count({
        where: { isMonitored: true },
      }),
      this.prisma.rawFeedback.count({
        where: { channel: 'JIRA', receivedAt: { gte: since } },
      }),
      this.prisma.$queryRaw<[{ avg: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM (pf."processedAt" - rf."received_at")) / 60) as avg
        FROM processed_feedbacks pf
        JOIN raw_feedbacks rf ON rf.id = pf.raw_feedback_id
        WHERE rf."received_at" >= ${since}
      `,
    ]);

    const priorityMap: Record<string, number> = {};
    for (const row of incidentsByPriority) {
      priorityMap[row.priorityLevel] = row._count;
    }

    const totalOpen = Object.values(priorityMap).reduce((a, b) => a + b, 0);

    return {
      totalOpenIncidents: totalOpen,
      criticalOpen: priorityMap['CRITICAL'] ?? 0,
      highOpen: priorityMap['HIGH'] ?? 0,
      avgResponseTimeMin: Math.round(avgResponseTime[0]?.avg ?? 0),
      feedbacksLast24h: feedbackCount,
      recategorizedToday: recategorizedCount,
      whatsappGroups: whatsappGroupCount,
      jiraTicketsToday: jiraTicketCount,
    };
  }

  async getBySystem() {
    const rows = await this.prisma.processedFeedback.groupBy({
      by: ['systemCode', 'priorityLevel'],
      _count: true,
    });

    const systemMap: Record<
      string,
      { total: number; critical: number; high: number; medium: number; low: number }
    > = {};

    for (const row of rows) {
      if (!systemMap[row.systemCode]) {
        systemMap[row.systemCode] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      }
      const entry = systemMap[row.systemCode];
      entry.total += row._count;
      const key = row.priorityLevel.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
      entry[key] += row._count;
    }

    return Object.entries(systemMap).map(([code, counts]) => ({
      system: code,
      code,
      ...counts,
    }));
  }

  async getHeatmap(period: '24h' | '7d' | '30d') {
    const since = this.periodToDate(period);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const rows = await this.prisma.$queryRaw<
      { dow: number; hour: number; count: bigint; avg_ps: number | null }[]
    >`
      SELECT
        EXTRACT(DOW FROM rf."received_at")::int as dow,
        EXTRACT(HOUR FROM rf."received_at")::int as hour,
        COUNT(*)::bigint as count,
        AVG(pf."priorityScore") as avg_ps
      FROM raw_feedbacks rf
      LEFT JOIN processed_feedbacks pf ON pf.raw_feedback_id = rf.id
      WHERE rf."received_at" >= ${since}
      GROUP BY dow, hour
      ORDER BY dow, hour
    `;

    // Fill all 7x24 slots
    const result: { day: string; dayOfWeek: number; hour: number; count: number; averagePriorityScore: number }[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const match = rows.find((r) => Number(r.dow) === d && Number(r.hour) === h);
        result.push({
          day: dayNames[d],
          dayOfWeek: d,
          hour: h,
          count: match ? Number(match.count) : 0,
          averagePriorityScore: match?.avg_ps ? Math.round(match.avg_ps * 10) / 10 : 0,
        });
      }
    }

    return result;
  }

  async getPriorityQueue(params: {
    systemCode?: string;
    priorityLevel?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {
      status: { in: ['OPEN', 'IN_PROGRESS'] as IncidentStatus[] },
    };

    if (params.systemCode) {
      where.systemCode = params.systemCode as SystemCode;
    }
    if (params.priorityLevel) {
      const levels = params.priorityLevel.split(',').map((l) => l.trim()) as PriorityLevel[];
      where.priorityLevel = { in: levels };
    }
    if (params.status) {
      const statuses = params.status.split(',').map((s) => s.trim()) as IncidentStatus[];
      where.status = { in: statuses };
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.incidentGroup.findMany({
        where,
        orderBy: { priorityScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          feedbacks: {
            select: { keywordsFound: true },
          },
        },
      }),
      this.prisma.incidentGroup.count({ where }),
    ]);

    return {
      data: data.map((ig) => {
        // Aggregate top 3 keywords
        const keywordCounts: Record<string, number> = {};
        for (const f of ig.feedbacks) {
          for (const kw of f.keywordsFound) {
            keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
          }
        }
        const topKeywords = Object.entries(keywordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([keyword, count]) => ({ keyword, count }));

        return {
          id: ig.id,
          title: ig.title,
          systemCode: ig.systemCode,
          feedbackType: ig.feedbackType,
          priorityScore: ig.priorityScore,
          priorityLevel: ig.priorityLevel,
          status: ig.status,
          feedbackCount: ig.feedbackCount,
          recurrenceCount: ig.recurrenceCount,
          firstSeenAt: ig.firstSeenAt.toISOString(),
          lastSeenAt: ig.lastSeenAt.toISOString(),
          topKeywords,
        };
      }),
      total,
      page,
      limit,
    };
  }

  async getMetrics() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalFeedbacks,
      criticalIncidents,
      highIncidents,
      newIncidentGroups,
      avgResolution,
      systemCounts,
    ] = await Promise.all([
      this.prisma.rawFeedback.count({
        where: { receivedAt: { gte: since24h } },
      }),
      this.prisma.incidentGroup.count({
        where: {
          priorityLevel: 'CRITICAL',
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.incidentGroup.count({
        where: {
          priorityLevel: 'HIGH',
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.incidentGroup.count({
        where: { createdAt: { gte: since24h } },
      }),
      this.prisma.$queryRaw<[{ avg: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "firstSeenAt")) / 60) as avg
        FROM incident_groups
        WHERE "resolvedAt" IS NOT NULL
          AND "resolvedAt" >= ${since24h}
      `,
      this.prisma.incidentGroup.groupBy({
        by: ['systemCode'],
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        _count: true,
        _avg: { priorityScore: true },
      }),
    ]);

    const systemHealthScore: Record<string, { openIncidents: number; avgPriorityScore: number; healthScore: number }> = {};
    for (const row of systemCounts) {
      const avgPS = row._avg.priorityScore ?? 0;
      // Health score: 100 = perfect, decreases with more/higher priority incidents
      const healthScore = Math.max(0, Math.round(100 - avgPS * row._count * 0.5));
      systemHealthScore[row.systemCode] = {
        openIncidents: row._count,
        avgPriorityScore: Math.round(avgPS * 10) / 10,
        healthScore,
      };
    }

    return {
      totalFeedbacks,
      criticalIncidents,
      highIncidents,
      newIncidentGroups,
      avgResolutionTimeMinutes: Math.round(avgResolution[0]?.avg ?? 0),
      systemHealthScore,
    };
  }

  async getRecurrences() {
    const data = await this.prisma.incidentGroup.findMany({
      where: { recurrenceCount: { gt: 0 } },
      orderBy: { recurrenceCount: 'desc' },
      include: {
        occurrences: {
          orderBy: { occurredAt: 'asc' },
        },
      },
    });

    return data.map((ig) => ({
      id: ig.id,
      title: ig.title,
      systemCode: ig.systemCode,
      feedbackType: ig.feedbackType,
      priorityScore: ig.priorityScore,
      priorityLevel: ig.priorityLevel,
      status: ig.status,
      feedbackCount: ig.feedbackCount,
      recurrenceCount: ig.recurrenceCount,
      firstSeenAt: ig.firstSeenAt.toISOString(),
      lastSeenAt: ig.lastSeenAt.toISOString(),
      resolvedAt: ig.resolvedAt?.toISOString() ?? null,
      occurrences: ig.occurrences.map((o) => ({
        id: o.id,
        occurredAt: o.occurredAt.toISOString(),
        resolvedAt: o.resolvedAt?.toISOString() ?? null,
        scoreSnapshot: o.scoreSnapshot,
      })),
    }));
  }

  private periodToDate(period: '24h' | '7d' | '30d'): Date {
    const now = new Date();
    switch (period) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

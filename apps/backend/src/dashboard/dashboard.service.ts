import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        SELECT AVG(EXTRACT(EPOCH FROM (pf."processedAt" - rf."receivedAt")) / 60) as avg
        FROM processed_feedbacks pf
        JOIN raw_feedbacks rf ON rf.id = pf.raw_feedback_id
        WHERE rf."receivedAt" >= ${since}
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
      {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
      }
    > = {};

    for (const row of rows) {
      if (!systemMap[row.systemCode]) {
        systemMap[row.systemCode] = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
      }
      const entry = systemMap[row.systemCode];
      entry.total += row._count;
      const key = row.priorityLevel.toLowerCase() as
        | 'critical'
        | 'high'
        | 'medium'
        | 'low';
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
      { dow: number; hour: number; count: bigint }[]
    >`
      SELECT
        EXTRACT(DOW FROM "receivedAt")::int as dow,
        EXTRACT(HOUR FROM "receivedAt")::int as hour,
        COUNT(*)::bigint as count
      FROM raw_feedbacks
      WHERE "receivedAt" >= ${since}
      GROUP BY dow, hour
      ORDER BY dow, hour
    `;

    // Fill all 7x24 slots
    const result: { day: string; hour: number; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const match = rows.find(
          (r) => Number(r.dow) === d && Number(r.hour) === h,
        );
        result.push({
          day: dayNames[d],
          hour: h,
          count: match ? Number(match.count) : 0,
        });
      }
    }

    return result;
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

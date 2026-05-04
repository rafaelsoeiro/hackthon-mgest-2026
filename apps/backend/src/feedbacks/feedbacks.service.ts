import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemCode, Prisma } from '@prisma/client';

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    system?: string;
    clusterId?: string;
    limit?: number;
    page?: number;
  }) {
    const where: Prisma.ProcessedFeedbackWhereInput = {};

    if (filters.system && filters.system !== 'ALL') {
      where.systemCode = filters.system as SystemCode;
    }
    if (filters.clusterId) {
      where.incidentGroupId = filters.clusterId;
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const [data, total] = await Promise.all([
      this.prisma.processedFeedback.findMany({
        where,
        orderBy: { processedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rawFeedback: true,
        },
      }),
      this.prisma.processedFeedback.count({ where }),
    ]);

    return {
      data: data.map((pf) => ({
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
        clusterId: pf.incidentGroupId,
        jiraKey: null,
        jiraUrl: null,
      })),
      total,
      page,
      limit,
    };
  }
}

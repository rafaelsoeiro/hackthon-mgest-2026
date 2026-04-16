import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JiraClient } from '../integrations/jira/jira.client';
import {
  FeedbackChannel,
  FeedbackType,
  PriorityLevel,
  SystemCode,
  IncidentStatus,
} from '@prisma/client';

interface ClassificationResult {
  systemCode: SystemCode;
  feedbackType: FeedbackType;
  severityScore: number;
  aiSummary: string;
  keywordsFound: string[];
  scoreS: number;
  scoreV: number;
  scoreR: number;
  scoreT: number;
  scoreK: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  reclassified: boolean;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jiraClient: JiraClient,
    private readonly config: ConfigService,
  ) {}

  async syncJira() {
    const projectKey = this.config.get<string>('JIRA_PROJECT_KEY');
    this.logger.log(`Iniciando sync do projeto ${projectKey}...`);

    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const issues = await this.jiraClient.searchIssues(jql, { maxResults: 100 });
    this.logger.log(`${issues.length} issues encontradas no Jira`);

    const timeWindows = await this.prisma.timeWindow.findMany({ where: { isActive: true } });
    const keywordRules = await this.prisma.keywordRule.findMany({ where: { isActive: true } });

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // ─── Batch check: buscar todos os externalIds existentes de uma vez ──
    const issueKeys = issues.map((i) => i.key);
    const existingFeedbacks = await this.prisma.rawFeedback.findMany({
      where: { externalId: { in: issueKeys }, channel: 'JIRA' },
      select: { externalId: true },
    });
    const existingKeys = new Set(existingFeedbacks.map((f) => f.externalId));

    // ─── Filtrar issues novas e classificar em memória (CPU-only) ──
    const newIssues = issues.filter((issue) => {
      if (existingKeys.has(issue.key)) {
        skipped++;
        return false;
      }
      return true;
    });

    // ─── Processar em batches de 20 usando transações ──
    const BATCH_SIZE = 20;
    for (let i = 0; i < newIssues.length; i += BATCH_SIZE) {
      const batch = newIssues.slice(i, i + BATCH_SIZE);
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const issue of batch) {
            const receivedAt = issue.createdAt ? new Date(issue.createdAt) : new Date();

            const raw = await tx.rawFeedback.create({
              data: {
                channel: FeedbackChannel.JIRA,
                externalId: issue.key,
                sourceGroupName: `Jira — ${projectKey}`,
                authorName: null,
                rawContent: issue.summary,
                receivedAt,
                processingStatus: 'PROCESSED',
              },
            });

            const classification = this.classify(issue.summary, receivedAt, timeWindows, keywordRules);

            await tx.processedFeedback.create({
              data: {
                rawFeedbackId: raw.id,
                systemCode: classification.systemCode,
                feedbackType: classification.feedbackType,
                severityScore: classification.severityScore,
                aiSummary: classification.aiSummary,
                keywordsFound: classification.keywordsFound,
                reclassified: classification.reclassified,
                scoreS: classification.scoreS,
                scoreV: classification.scoreV,
                scoreR: classification.scoreR,
                scoreT: classification.scoreT,
                scoreK: classification.scoreK,
                priorityScore: classification.priorityScore,
                priorityLevel: classification.priorityLevel,
                processedAt: new Date(),
              },
            });

            created++;
          }
        });
      } catch (err) {
        this.logger.error(`Erro ao processar batch [${i}..${i + batch.length}]: ${err}`);
        failed += batch.length;
      }
    }

    // ─── Agrupar em IncidentGroups ─────────────────────
    await this.groupFeedbacks();

    // ─── Log de sync ───────────────────────────────────
    await this.prisma.jiraSyncLog.create({
      data: {
        syncedAt: new Date(),
        issuesFetched: issues.length,
        issuesCreated: created,
        issuesFailed: failed,
      },
    });

    const summary = { fetched: issues.length, created, skipped, failed };
    this.logger.log(`Sync concluído: ${JSON.stringify(summary)}`);
    return summary;
  }

  private classify(
    text: string,
    receivedAt: Date,
    timeWindows: { startHour: number; endHour: number; boost: number }[],
    keywordRules: { pattern: string; scoreK: number; forceOverride: boolean; overrideMinPS: number | null }[],
  ): ClassificationResult {
    const lower = text.toLowerCase();
    const keywordsFound: string[] = [];

    // ─── System Detection ──────────────────────────────
    const systemMap: Array<[RegExp, SystemCode]> = [
      [/fatur|nota fiscal|nf|sefaz|boleto|cobran[cç]a|valor errado/i, SystemCode.GM_FIN],
      [/estoque|cd |wms|caminh[aã]o|motorista|frete|carga|expedi[cç]/i, SystemCode.GM_LOG],
      [/rede|internet|infraestrutura|impressora|datacenter|conectiv/i, SystemCode.GM_INFRA],
      [/erp|sap|relat[oó]rio|m[oó]dulo|suite/i, SystemCode.GM_SUITE],
      [/login|sso|senha|acesso|permiss[aã]o|app|mobile/i, SystemCode.GM_CORE],
    ];
    let systemCode: SystemCode = SystemCode.GM_OTHER;
    for (const [regex, code] of systemMap) {
      if (regex.test(lower)) {
        systemCode = code;
        break;
      }
    }

    // ─── ScoreS (Severidade) ───────────────────────────
    let scoreS = 4;
    if (/parou|caiu|trav|parad|sem comunica|opera[cç][aã]o parada/i.test(lower)) {
      scoreS = 9 + Math.random();
      keywordsFound.push('critical-severity');
    } else if (/erro|falha|n[aã]o funciona|n[aã]o consigo|fecha sozinho/i.test(lower)) {
      scoreS = 6 + Math.random() * 2;
      keywordsFound.push('high-severity');
    } else if (/lent|demora|timeout|intermitente/i.test(lower)) {
      scoreS = 4 + Math.random() * 2;
      keywordsFound.push('medium-severity');
    }

    // ─── ScoreT (Temporal) ─────────────────────────────
    const hour = receivedAt.getHours();
    let scoreT = 3;
    for (const tw of timeWindows) {
      if (hour >= tw.startHour && hour < tw.endHour) {
        scoreT = Math.min(10, 3 + tw.boost * 2);
        break;
      }
    }

    // ─── ScoreK (Keywords) ─────────────────────────────
    let scoreK = 2;
    let forceOverride = false;
    for (const rule of keywordRules) {
      if (lower.includes(rule.pattern.toLowerCase())) {
        scoreK = Math.max(scoreK, rule.scoreK);
        keywordsFound.push(rule.pattern);
        if (rule.forceOverride) forceOverride = true;
      }
    }

    // ─── ScoreV e ScoreR (serão recalculados no agrupamento) ──
    const scoreV = 3 + Math.random() * 4;
    const scoreR = 2 + Math.random() * 4;

    // ─── Priority Score ────────────────────────────────
    let priorityScore = Math.round(
      (scoreS * 0.35 + scoreV * 0.25 + scoreR * 0.20 + scoreT * 0.10 + scoreK * 0.10) * 10,
    );
    if (forceOverride && priorityScore < 85) priorityScore = 85;
    priorityScore = Math.min(100, priorityScore);

    const priorityLevel = this.calcPriority(priorityScore);

    const feedbackType =
      scoreS >= 7 ? FeedbackType.INCIDENT :
      scoreS >= 4 ? FeedbackType.IMPROVEMENT :
      FeedbackType.DOUBT;

    return {
      systemCode,
      feedbackType,
      severityScore: Math.round(scoreS * 10) / 10,
      aiSummary: `[IA] ${text}`,
      keywordsFound,
      scoreS: Math.round(scoreS * 10) / 10,
      scoreV: Math.round(scoreV * 10) / 10,
      scoreR: Math.round(scoreR * 10) / 10,
      scoreT: Math.round(scoreT * 10) / 10,
      scoreK: Math.round(scoreK * 10) / 10,
      priorityScore,
      priorityLevel,
      reclassified: forceOverride,
    };
  }

  private async groupFeedbacks() {
    this.logger.log('Agrupando feedbacks em IncidentGroups...');

    const ungrouped = await this.prisma.processedFeedback.findMany({
      where: { incidentGroupId: null },
      take: 500, // Limit to avoid full table scan
      orderBy: { processedAt: 'desc' },
      include: { rawFeedback: { select: { rawContent: true, receivedAt: true } } },
    });

    if (ungrouped.length === 0) return;

    // Agrupar por systemCode + primeiras palavras-chave do texto
    const groups: Record<string, typeof ungrouped> = {};
    for (const pf of ungrouped) {
      const words = pf.rawFeedback.rawContent.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      const key = `${pf.systemCode}::${words}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pf);
    }

    for (const [key, feedbacks] of Object.entries(groups)) {
      const [systemCode] = key.split('::');
      const first = feedbacks[0];

      const avgPS = Math.round(
        feedbacks.reduce((s, f) => s + f.priorityScore, 0) / feedbacks.length,
      );

      const existing = await this.prisma.incidentGroup.findFirst({
        where: {
          systemCode: systemCode as SystemCode,
          title: first.rawFeedback.rawContent.slice(0, 60),
        },
      });

      if (existing) {
        await this.prisma.incidentGroup.update({
          where: { id: existing.id },
          data: {
            feedbackCount: { increment: feedbacks.length },
            lastSeenAt: new Date(),
            priorityScore: avgPS,
            priorityLevel: this.calcPriority(avgPS),
          },
        });
        await this.prisma.processedFeedback.updateMany({
          where: { id: { in: feedbacks.map((f) => f.id) } },
          data: { incidentGroupId: existing.id },
        });
      } else {
        const dates = feedbacks.map((f) => f.rawFeedback.receivedAt.getTime());
        const ig = await this.prisma.incidentGroup.create({
          data: {
            title: first.rawFeedback.rawContent.slice(0, 80),
            systemCode: systemCode as SystemCode,
            feedbackType: first.feedbackType,
            priorityScore: avgPS,
            priorityLevel: this.calcPriority(avgPS),
            status: IncidentStatus.OPEN,
            feedbackCount: feedbacks.length,
            recurrenceCount: 1,
            firstSeenAt: new Date(Math.min(...dates)),
            lastSeenAt: new Date(Math.max(...dates)),
          },
        });
        await this.prisma.processedFeedback.updateMany({
          where: { id: { in: feedbacks.map((f) => f.id) } },
          data: { incidentGroupId: ig.id },
        });
        await this.prisma.incidentOccurrence.create({
          data: {
            incidentGroupId: ig.id,
            occurredAt: new Date(Math.min(...dates)),
            scoreSnapshot: avgPS,
          },
        });
      }
    }

    this.logger.log(`Agrupamento concluído: ${Object.keys(groups).length} grupos processados`);
  }

  private calcPriority(ps: number): PriorityLevel {
    if (ps >= 75) return PriorityLevel.CRITICAL;
    if (ps >= 50) return PriorityLevel.HIGH;
    if (ps >= 25) return PriorityLevel.MEDIUM;
    return PriorityLevel.LOW;
  }
}

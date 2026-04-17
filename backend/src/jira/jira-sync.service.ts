import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { JiraClient } from '../integrations/jira/jira.client';
import { ConfigService } from '@nestjs/config';
import { FeedbackChannel } from '@prisma/client';

@Injectable()
export class JiraSyncService implements OnModuleInit {
  private readonly logger = new Logger(JiraSyncService.name);
  private readonly projectKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jiraClient: JiraClient,
    private readonly config: ConfigService,
    @InjectQueue('jira-ingestion') private readonly jiraQueue: Queue,
  ) {
    this.projectKey = this.config.get<string>('JIRA_PROJECT_KEY')!;
  }

  onModuleInit() {
    this.logger.log('JiraSyncService initialized — cron scheduled every 5 minutes');
  }

  /**
   * Triggered via controller — enqueues a sync job and returns immediately.
   */
  async enqueueSyncJob(since?: string): Promise<{
    jobId: string;
    message: string;
    estimatedIssues: number;
  }> {
    // Estimate how many issues will be fetched
    const jql = this.buildJql(since);
    let estimatedIssues = 0;
    try {
      const issues = await this.jiraClient.searchIssues(jql, { maxResults: 1 });
      // The search returns items, but we use it just to get a count estimate
      estimatedIssues = issues.length > 0 ? 100 : 0; // rough estimate
    } catch {
      estimatedIssues = -1; // unknown
    }

    const job = await this.jiraQueue.add('jira-sync', { since });

    return {
      jobId: job.id!,
      message: 'Jira sync job enqueued successfully',
      estimatedIssues,
    };
  }

  /**
   * Cron: runs every 5 minutes automatically.
   */
  @Cron('*/5 * * * *')
  async handleCron() {
    this.logger.log('[CRON] Starting scheduled Jira sync...');
    try {
      const result = await this.syncIssues();
      this.logger.log(`[CRON] Jira sync completed: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error(`[CRON] Jira sync failed: ${err}`);
    }
  }

  /**
   * Core sync logic — paginated JQL query, upsert by externalId,
   * retry on 429, JiraSyncLog creation.
   */
  async syncIssues(since?: string): Promise<{
    fetched: number;
    created: number;
    skipped: number;
    failed: number;
  }> {
    const jql = this.buildJql(since);
    this.logger.log(`Syncing Jira issues — JQL: ${jql}`);

    let allIssues: Array<{
      key: string;
      summary: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }> = [];

    // ─── Paginated fetch with 429 retry ──
    const PAGE_SIZE = 100;
    let startAt = 0;
    let hasMore = true;

    while (hasMore) {
      const page = await this.fetchWithRetry(jql, startAt, PAGE_SIZE);
      allIssues = allIssues.concat(page);

      if (page.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        startAt += PAGE_SIZE;
      }
    }

    this.logger.log(`Fetched ${allIssues.length} issues from Jira`);

    // ─── Filter: ignore Done + updated > 30 days ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = allIssues.filter((issue) => {
      if (
        issue.status?.toLowerCase() === 'done' &&
        new Date(issue.updatedAt) < thirtyDaysAgo
      ) {
        return false;
      }
      return true;
    });

    this.logger.log(
      `After filtering: ${filtered.length} issues (${allIssues.length - filtered.length} filtered out)`,
    );

    // ─── Batch dedup check ──
    const issueKeys = filtered.map((i) => i.key);
    const existing = await this.prisma.rawFeedback.findMany({
      where: { externalId: { in: issueKeys }, channel: FeedbackChannel.JIRA },
      select: { externalId: true },
    });
    const existingKeys = new Set(existing.map((f) => f.externalId));

    // ─── Load keyword rules for reclassification ──
    const keywordRules = await this.prisma.keywordRule.findMany({
      where: { isActive: true },
    });

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // ─── Process in batches ──
    const BATCH_SIZE = 20;
    const newIssues = filtered.filter((issue) => {
      if (existingKeys.has(issue.key)) {
        skipped++;
        return false;
      }
      return true;
    });

    for (let i = 0; i < newIssues.length; i += BATCH_SIZE) {
      const batch = newIssues.slice(i, i + BATCH_SIZE);
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const issue of batch) {
            const receivedAt = issue.createdAt
              ? new Date(issue.createdAt)
              : new Date();

            // ─── Reclassification rule ──
            const jiraCategory = this.detectCategory(issue.summary);
            const maxScoreK = this.getMaxScoreK(issue.summary, keywordRules);
            const suggestReclassify =
              jiraCategory === 'Outros' && maxScoreK >= 7;

            await tx.rawFeedback.create({
              data: {
                channel: FeedbackChannel.JIRA,
                externalId: issue.key,
                sourceGroupName: `Jira — ${this.projectKey}`,
                authorName: null,
                rawContent: issue.summary,
                receivedAt,
                processingStatus: 'PENDING',
                attachments: suggestReclassify
                  ? { suggestedReclassify: true }
                  : undefined,
              },
            });

            created++;
          }
        });
      } catch (err) {
        this.logger.error(
          `Error processing batch [${i}..${i + batch.length}]: ${err}`,
        );
        failed += batch.length;
      }
    }

    // ─── JiraSyncLog ──
    await this.prisma.jiraSyncLog.create({
      data: {
        syncedAt: new Date(),
        issuesFetched: allIssues.length,
        issuesCreated: created,
        issuesFailed: failed,
        lastJiraUpdated: allIssues.length > 0
          ? new Date(allIssues[0].updatedAt)
          : null,
      },
    });

    const summary = {
      fetched: allIssues.length,
      created,
      skipped,
      failed,
    };
    this.logger.log(`Sync completed: ${JSON.stringify(summary)}`);
    return summary;
  }

  // ─── Private helpers ──────────────────────────────────

  private buildJql(since?: string): string {
    let jql = `project = ${this.projectKey} ORDER BY updated DESC`;
    if (since) {
      jql = `project = ${this.projectKey} AND updated >= "${since}" ORDER BY updated DESC`;
    }
    return jql;
  }

  private async fetchWithRetry(
    jql: string,
    startAt: number,
    maxResults: number,
    retries = 3,
  ): Promise<
    Array<{
      key: string;
      summary: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.jiraClient.searchIssues(jql, {
          startAt,
          maxResults,
        });
      } catch (err: any) {
        if (err?.response?.status === 429 && attempt < retries) {
          const retryAfter =
            parseInt(err.response.headers?.['retry-after'], 10) || 5;
          this.logger.warn(
            `Jira 429 rate limited — retrying in ${retryAfter}s (attempt ${attempt}/${retries})`,
          );
          await this.delay(retryAfter * 1000);
        } else {
          throw err;
        }
      }
    }
    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private detectCategory(text: string): string {
    const lower = text.toLowerCase();
    if (/fatur|nota fiscal|nf|boleto|cobran[cç]a/i.test(lower)) return 'Financeiro';
    if (/estoque|cd |wms|caminh[aã]o|frete|carga/i.test(lower)) return 'Logística';
    if (/rede|internet|infraestrutura|impressora/i.test(lower)) return 'Infra';
    if (/erp|sap|relat[oó]rio|m[oó]dulo/i.test(lower)) return 'Suite';
    if (/login|sso|senha|acesso|permiss[aã]o/i.test(lower)) return 'Core';
    return 'Outros';
  }

  private getMaxScoreK(
    text: string,
    rules: Array<{ pattern: string; scoreK: number }>,
  ): number {
    const lower = text.toLowerCase();
    let max = 0;
    for (const rule of rules) {
      if (lower.includes(rule.pattern.toLowerCase())) {
        max = Math.max(max, rule.scoreK);
      }
    }
    return max;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { RawFeedback, SystemCode } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service.js';
import {
  AIAnalysisResult,
  AIAnalysisResultSchema,
  SYSTEM_PROMPT,
} from './ai-analysis.types.js';

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);
  private readonly client: Anthropic;
  private readonly TIMEOUT_MS = 8_000; // Reduced from 15s — fallback will handle slow calls
  private readonly MAX_CALLS_PER_MIN = 40;
  private callTimestamps: number[] = [];
  private retryDelays = [5_000, 15_000, 60_000]; // Backoff for 429/5xx retries
  private readonly analysisCache = new Map<string, { result: AIAnalysisResult; expiry: number }>();
  private static readonly CACHE_TTL_MS = 5 * 60_000; // 5 min cache for identical content

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async analyze(rawFeedback: RawFeedback): Promise<AIAnalysisResult> {
    // Check cache first — identical content gets same classification
    const cacheKey = rawFeedback.rawContent.trim().toLowerCase();
    const cached = this.analysisCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      this.logger.debug(`Cache hit for feedback analysis`);
      return cached.result;
    }

    await this.throttle();

    const userPrompt = this.buildUserPrompt(rawFeedback);

    try {
      const result = await this.callClaudeWithRetry(userPrompt);
      this.analysisCache.set(cacheKey, {
        result,
        expiry: Date.now() + AIAnalysisService.CACHE_TTL_MS,
      });
      // Evict old entries periodically
      if (this.analysisCache.size > 500) {
        const now = Date.now();
        for (const [k, v] of this.analysisCache) {
          if (v.expiry < now) this.analysisCache.delete(k);
        }
      }
      return result;
    } catch (err) {
      this.logger.warn(
        `Claude API falhou, usando fallback: ${err instanceof Error ? err.message : err}`,
      );
      return this.fallbackAnalysis(rawFeedback);
    }
  }

  private buildUserPrompt(raw: RawFeedback): string {
    const time = raw.receivedAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return [
      `Canal: ${raw.channel}`,
      `Grupo/Origem: ${raw.sourceGroupName ?? 'N/A'}`,
      `Conteúdo: ${raw.rawContent}`,
      `Categoria Jira: ${(raw as any).jiraCategory ?? 'N/A'}`,
      `Recebido às: ${time}`,
    ].join('\n');
  }

  private async callClaude(
    userPrompt: string,
    temperature: number,
  ): Promise<AIAnalysisResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await this.client.messages.create(
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          temperature,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        },
        { signal: controller.signal },
      );

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';

      const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const validated = AIAnalysisResultSchema.parse(parsed);

      return {
        ...validated,
        reclassified: validated.reclassificationReason !== null,
      };
    } catch (err) {
      // Propagate retryable API errors (429/5xx) directly to callClaudeWithRetry
      if (this.isRetryableError(err)) {
        throw err;
      }
      if (temperature === 0) {
        this.logger.warn('Primeira tentativa falhou, retentando com temperature=0.1');
        return this.callClaude(userPrompt, 0.1);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callClaudeWithRetry(userPrompt: string): Promise<AIAnalysisResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryDelays.length; attempt++) {
      try {
        return await this.callClaude(userPrompt, 0);
      } catch (err) {
        lastError = err;

        if (this.isRetryableError(err) && attempt < this.retryDelays.length) {
          const delay = this.retryDelays[attempt];
          this.logger.warn(
            `Erro ${(err as any).status} da Claude API (tentativa ${attempt + 1}/${this.retryDelays.length + 1}), retry em ${delay / 1000}s`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  private isRetryableError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'status' in err) {
      const status = (err as any).status;
      return status === 429 || (status >= 500 && status < 600);
    }
    return false;
  }

  async fallbackAnalysis(rawFeedback: RawFeedback): Promise<AIAnalysisResult> {
    const text = rawFeedback.rawContent.toLowerCase();

    // Buscar systemHint do grupo WhatsApp
    let systemCode: SystemCode = SystemCode.GM_OTHER;
    if (rawFeedback.sourceGroupId) {
      const group = await this.prisma.whatsAppGroup.findUnique({
        where: { groupId: rawFeedback.sourceGroupId },
      });
      if (group?.systemHint) {
        systemCode = group.systemHint;
      }
    }

    // Buscar keyword rules ativas
    const keywordRules = await this.prisma.keywordRule.findMany({
      where: { isActive: true },
    });

    const keywordsFound: string[] = [];
    let maxScoreK = 0;

    for (const rule of keywordRules) {
      if (text.includes(rule.pattern.toLowerCase())) {
        keywordsFound.push(rule.pattern);
        if (rule.scoreK > maxScoreK) {
          maxScoreK = rule.scoreK;
        }
      }
    }

    // Mapear scoreK (0-10 no banco) para severidade 0-10
    const severityScore = Math.min(10, maxScoreK);

    return {
      systemCode,
      feedbackType: 'INCIDENT',
      severityScore,
      summary: `[Fallback] ${rawFeedback.rawContent.substring(0, 100)}`,
      keywordsFound,
      reclassificationReason: null,
      reclassified: false,
    };
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.callTimestamps = this.callTimestamps.filter(
      (ts) => now - ts < 60_000,
    );

    if (this.callTimestamps.length >= this.MAX_CALLS_PER_MIN) {
      const oldest = this.callTimestamps[0];
      const waitMs = 60_000 - (now - oldest);
      this.logger.debug(`Rate limit atingido, aguardando ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.callTimestamps.push(Date.now());
  }
}

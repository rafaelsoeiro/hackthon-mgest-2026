import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service.js';
import { calcPriorityScore } from './priority-score.calculator.js';
import type {
  TimeWindow,
  KeywordRule,
  PSInput,
  PSResult,
} from './priority-score.types.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

@Injectable()
export class PriorityScoreService {
  private timeWindowsCache: TimeWindow[] | null = null;
  private keywordRulesCache: KeywordRule[] | null = null;
  private lastCacheRefresh = 0;

  constructor(private readonly prisma: PrismaService) {}

  private isCacheValid(): boolean {
    return (
      this.timeWindowsCache !== null &&
      this.keywordRulesCache !== null &&
      Date.now() - this.lastCacheRefresh < CACHE_TTL_MS
    );
  }

  private async refreshCache(): Promise<void> {
    const [timeWindows, keywordRules] = await Promise.all([
      this.prisma.timeWindow.findMany({ where: { isActive: true } }),
      this.prisma.keywordRule.findMany({ where: { isActive: true } }),
    ]);

    this.timeWindowsCache = timeWindows;
    this.keywordRulesCache = keywordRules;
    this.lastCacheRefresh = Date.now();
  }

  async calculate(input: PSInput): Promise<PSResult> {
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    return calcPriorityScore(
      input,
      this.timeWindowsCache!,
      this.keywordRulesCache!,
    );
  }

  /** Força refresh do cache (útil após update de regras) */
  invalidateCache(): void {
    this.timeWindowsCache = null;
    this.keywordRulesCache = null;
    this.lastCacheRefresh = 0;
  }
}

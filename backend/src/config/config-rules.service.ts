import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriorityScoreService } from '../priority-score/priority-score.service';
import { CreateTimeWindowDto } from './dto/create-time-window.dto';
import { CreateKeywordRuleDto } from './dto/create-keyword-rule.dto';

@Injectable()
export class ConfigRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priorityScoreService: PriorityScoreService,
  ) {}

  // ─── TimeWindows ──────────────────────────────────────

  async findAllTimeWindows() {
    return this.prisma.timeWindow.findMany({
      orderBy: { startHour: 'asc' },
    });
  }

  async createTimeWindow(dto: CreateTimeWindowDto) {
    const tw = await this.prisma.timeWindow.create({ data: dto });
    this.priorityScoreService.invalidateCache();
    return tw;
  }

  async deleteTimeWindow(id: string) {
    const tw = await this.prisma.timeWindow.findUnique({ where: { id } });
    if (!tw) throw new NotFoundException(`TimeWindow ${id} not found`);
    await this.prisma.timeWindow.delete({ where: { id } });
    this.priorityScoreService.invalidateCache();
    return { success: true };
  }

  // ─── KeywordRules ─────────────────────────────────────

  async findAllKeywordRules() {
    return this.prisma.keywordRule.findMany({
      orderBy: { scoreK: 'desc' },
    });
  }

  async createKeywordRule(dto: CreateKeywordRuleDto) {
    const kr = await this.prisma.keywordRule.create({ data: dto });
    this.priorityScoreService.invalidateCache();
    return kr;
  }

  async deleteKeywordRule(id: string) {
    const kr = await this.prisma.keywordRule.findUnique({ where: { id } });
    if (!kr) throw new NotFoundException(`KeywordRule ${id} not found`);
    await this.prisma.keywordRule.delete({ where: { id } });
    this.priorityScoreService.invalidateCache();
    return { success: true };
  }
}

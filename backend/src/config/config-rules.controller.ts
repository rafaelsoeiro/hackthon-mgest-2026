import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ConfigRulesService } from './config-rules.service';
import { CreateTimeWindowDto } from './dto/create-time-window.dto';
import { CreateKeywordRuleDto } from './dto/create-keyword-rule.dto';

@Controller('api/v1/config')
export class ConfigRulesController {
  constructor(private readonly configRulesService: ConfigRulesService) {}

  // ─── TimeWindows ──────────────────────────────────────

  @Get('time-windows')
  findAllTimeWindows() {
    return this.configRulesService.findAllTimeWindows();
  }

  @Post('time-windows')
  createTimeWindow(@Body() dto: CreateTimeWindowDto) {
    return this.configRulesService.createTimeWindow(dto);
  }

  @Delete('time-windows/:id')
  deleteTimeWindow(@Param('id') id: string) {
    return this.configRulesService.deleteTimeWindow(id);
  }

  // ─── KeywordRules ─────────────────────────────────────

  @Get('keyword-rules')
  findAllKeywordRules() {
    return this.configRulesService.findAllKeywordRules();
  }

  @Post('keyword-rules')
  createKeywordRule(@Body() dto: CreateKeywordRuleDto) {
    return this.configRulesService.createKeywordRule(dto);
  }

  @Delete('keyword-rules/:id')
  deleteKeywordRule(@Param('id') id: string) {
    return this.configRulesService.deleteKeywordRule(id);
  }
}

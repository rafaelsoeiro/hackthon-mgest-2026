import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { PeriodDto } from '../common/dto/query.dto';

@Controller('dashboard')
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @CacheTTL(30_000) // 30 seconds
  getOverview(@Query() query: PeriodDto) {
    return this.dashboardService.getOverview(query.period ?? '24h');
  }

  @Get('by-system')
  @CacheTTL(60_000) // 60 seconds — changes less often
  getBySystem() {
    return this.dashboardService.getBySystem();
  }

  @Get('heatmap')
  @CacheTTL(120_000) // 2 minutes — historical data
  getHeatmap(@Query() query: PeriodDto) {
    return this.dashboardService.getHeatmap(query.period ?? '7d');
  }

  @Get('priority-queue')
  @CacheTTL(15_000)
  getPriorityQueue(
    @Query('systemCode') systemCode?: string,
    @Query('priorityLevel') priorityLevel?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getPriorityQueue({
      systemCode,
      priorityLevel,
      status,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('metrics')
  @CacheTTL(30_000)
  getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Get('recurrences')
  @CacheTTL(60_000)
  getRecurrences() {
    return this.dashboardService.getRecurrences();
  }
}

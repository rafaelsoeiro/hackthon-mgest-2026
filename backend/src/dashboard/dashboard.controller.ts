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
}

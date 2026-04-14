import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PeriodDto } from '../common/dto/query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Query() query: PeriodDto) {
    return this.dashboardService.getOverview(query.period ?? '24h');
  }

  @Get('by-system')
  getBySystem() {
    return this.dashboardService.getBySystem();
  }

  @Get('heatmap')
  getHeatmap(@Query() query: PeriodDto) {
    return this.dashboardService.getHeatmap(query.period ?? '7d');
  }
}

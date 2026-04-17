import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JiraSyncService } from './jira-sync.service';

@Controller('api/v1/jira')
export class JiraSyncController {
  constructor(private readonly jiraSyncService: JiraSyncService) {}

  @Get('sync')
  @HttpCode(HttpStatus.OK)
  async triggerSync(@Query('since') since?: string) {
    return this.jiraSyncService.enqueueSyncJob(since);
  }
}

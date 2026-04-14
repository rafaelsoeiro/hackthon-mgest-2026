import { Controller, Post, HttpCode } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('sync-jira')
  @HttpCode(200)
  async syncJira() {
    return this.ingestionService.syncJira();
  }
}

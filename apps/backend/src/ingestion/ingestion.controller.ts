import {
  Controller,
  Post,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from './ingestion.service';
import { isFeatureEnabled } from '../config/env.validation';

@Controller('ingestion')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly config: ConfigService,
  ) {}

  @Post('sync-jira')
  @HttpCode(200)
  async syncJira() {
    const enabled = isFeatureEnabled(
      this.config.get<string>('FEATURE_JIRA_ENABLED'),
      true,
    );
    if (!enabled) {
      throw new ServiceUnavailableException(
        'Feature Jira desabilitada. Ative FEATURE_JIRA_ENABLED=true para usar sync-jira.',
      );
    }
    return this.ingestionService.syncJira();
  }
}

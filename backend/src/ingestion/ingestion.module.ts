import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { JiraModule } from '../integrations/jira/jira.module';

@Module({
  imports: [JiraModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}

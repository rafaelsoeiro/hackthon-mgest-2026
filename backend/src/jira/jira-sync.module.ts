import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JiraSyncService } from './jira-sync.service';
import { JiraSyncController } from './jira-sync.controller';
import { JiraModule as JiraIntegrationModule } from '../integrations/jira/jira.module';
import { QueueModule } from '../queue/queue.module.js';

@Module({
  imports: [ScheduleModule.forRoot(), JiraIntegrationModule, QueueModule],
  controllers: [JiraSyncController],
  providers: [JiraSyncService],
})
export class JiraSyncModule {}

import { Module } from '@nestjs/common';
import { JiraClient } from './jira.client';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';

@Module({
  controllers: [JiraController],
  providers: [JiraClient, JiraService],
  exports: [JiraClient],
})
export class JiraModule {}

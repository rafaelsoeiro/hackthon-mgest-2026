import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { EvolutionModule } from './integrations/evolution/evolution.module';
import { JiraModule } from './integrations/jira/jira.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IncidentsModule } from './incidents/incidents.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PriorityScoreModule } from './priority-score/priority-score.module';
import { AIModule } from './ai/ai.module';
import { ProcessingModule } from './processing/processing.module';
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    QueueModule,
    HealthModule,
    EvolutionModule,
    JiraModule,
    DashboardModule,
    IncidentsModule,
    FeedbacksModule,
    IngestionModule,
    PriorityScoreModule,
    AIModule,
    ProcessingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

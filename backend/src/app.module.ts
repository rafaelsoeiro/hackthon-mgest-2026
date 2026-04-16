import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import Joi from 'joi';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        ANTHROPIC_API_KEY: Joi.string().required(),
        JIRA_BASE_URL: Joi.string().uri().required(),
        JIRA_EMAIL: Joi.string().email().required(),
        JIRA_API_TOKEN: Joi.string().required(),
        JIRA_PROJECT_KEY: Joi.string().required(),
        EVOLUTION_API_URL: Joi.string().uri().required(),
        EVOLUTION_API_KEY: Joi.string().required(),
        WEBHOOK_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
      validationOptions: {
        abortEarly: false,
      },
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 30_000, // 30s default TTL
      max: 100,    // max 100 cached items
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

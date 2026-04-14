import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: 1000,
};

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: 'wa-ingestion',
        defaultJobOptions,
      },
      {
        name: 'jira-ingestion',
        defaultJobOptions,
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

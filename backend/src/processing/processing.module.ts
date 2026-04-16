import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AIModule } from '@/ai/ai.module.js';
import { PriorityScoreModule } from '@/priority-score/priority-score.module.js';
import { QueueModule } from '@/queue/queue.module.js';
import { WaProcessingWorker, JiraProcessingWorker } from './processing.worker.js';
import { ClusteringService } from './clustering.service.js';
import { RecurrenceService } from './recurrence.service.js';
import { ProcessingController } from './processing.controller.js';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AIModule,
    PriorityScoreModule,
    QueueModule,
  ],
  controllers: [ProcessingController],
  providers: [
    WaProcessingWorker,
    JiraProcessingWorker,
    ClusteringService,
    RecurrenceService,
  ],
  exports: [ClusteringService, RecurrenceService],
})
export class ProcessingModule {}

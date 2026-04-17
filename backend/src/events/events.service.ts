import { Injectable, Logger, MessageEvent, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICFEvent, ICFEventType } from './events.types.js';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private readonly subject = new Subject<ICFEvent>();
  private heartbeatInterval: ReturnType<typeof setInterval>;
  private queueStatsInterval: ReturnType<typeof setInterval>;

  constructor(
    @InjectQueue('wa-ingestion') private readonly waQueue: Queue,
    @InjectQueue('jira-ingestion') private readonly jiraQueue: Queue,
  ) {}

  onModuleInit() {
    this.heartbeatInterval = setInterval(() => {
      this.emit('ping' as any, {});
    }, 30_000);

    this.queueStatsInterval = setInterval(() => {
      this.emitQueueStats();
    }, 10_000);

    this.logger.log('SSE stream initialized (heartbeat=30s, queue_stats=10s)');
  }

  onModuleDestroy() {
    clearInterval(this.heartbeatInterval);
    clearInterval(this.queueStatsInterval);
    this.subject.complete();
  }

  emit(type: ICFEventType, payload: Record<string, any>) {
    const event: ICFEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.subject.next(event);
  }

  getStream(): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      map((event) => {
        return {
          data: JSON.stringify(event),
          type: event.type,
          id: `${Date.now()}`,
        } as MessageEvent;
      }),
    );
  }

  // --- EventEmitter2 listeners ---

  @OnEvent('sse.new_incident')
  handleNewIncident(payload: Record<string, any>) {
    this.emit('new_incident', payload);
  }

  @OnEvent('sse.ps_updated')
  handlePsUpdated(payload: Record<string, any>) {
    this.emit('ps_updated', payload);
  }

  @OnEvent('sse.override_triggered')
  handleOverrideTriggered(payload: Record<string, any>) {
    this.emit('override_triggered', payload);
  }

  @OnEvent('pattern_detected')
  handlePatternDetected(payload: Record<string, any>) {
    this.emit('pattern_detected', payload);
  }

  // --- Periodic queue stats ---

  private async emitQueueStats() {
    try {
      const [waCounts, jiraCounts] = await Promise.all([
        this.waQueue.getJobCounts('waiting', 'active', 'failed', 'completed'),
        this.jiraQueue.getJobCounts('waiting', 'active', 'failed', 'completed'),
      ]);

      this.emit('queue_stats', {
        pending: (waCounts.waiting ?? 0) + (jiraCounts.waiting ?? 0),
        processing: (waCounts.active ?? 0) + (jiraCounts.active ?? 0),
        failed: (waCounts.failed ?? 0) + (jiraCounts.failed ?? 0),
        completed: (waCounts.completed ?? 0) + (jiraCounts.completed ?? 0),
      });
    } catch (err) {
      this.logger.warn(
        `Failed to emit queue_stats: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

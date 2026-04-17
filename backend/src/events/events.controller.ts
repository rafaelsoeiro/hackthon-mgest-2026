import { Controller, Sse, Logger, Res, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Response } from 'express';
import { EventsService } from './events.service.js';

@Controller('api/v1/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  @Sse()
  stream(@Res() res: Response): Observable<MessageEvent> {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('X-Accel-Buffering', 'no');

    this.logger.log('New SSE client connected');

    res.on('close', () => {
      this.logger.log('SSE client disconnected');
    });

    return this.eventsService.getStream();
  }
}

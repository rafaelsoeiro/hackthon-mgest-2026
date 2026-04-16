import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const start = performance.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Math.round(performance.now() - start);
        const level = elapsed > 3000 ? 'warn' : 'log';
        this.logger[level](`${method} ${url} — ${elapsed}ms`);
      }),
    );
  }
}

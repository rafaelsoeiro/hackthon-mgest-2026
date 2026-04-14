import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check() {
    const [db, redis] = await Promise.allSettled([
      this.checkDb(),
      this.checkRedis(),
    ]);

    return {
      status:
        db.status === 'fulfilled' && redis.status === 'fulfilled'
          ? 'ok'
          : 'degraded',
      db: db.status === 'fulfilled' ? 'ok' : 'error',
      redis: redis.status === 'fulfilled' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<void> {
    await this.prisma.$queryRawUnsafe('SELECT 1');
  }

  private async checkRedis(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL')!;
    const client = new Redis(redisUrl);
    try {
      await client.ping();
    } finally {
      client.disconnect();
    }
  }
}

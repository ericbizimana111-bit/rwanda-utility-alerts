import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

import { NotificationQueueService } from './notifications/notification-queue.service';

@SkipThrottle()
@Controller()
export class AppController {
  private readonly startedAt = Date.now();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notificationQueue: NotificationQueueService,
  ) { }

  @Get()
  getHello() {
    return {
      message: 'Rwanda Utility Alerts API is running',
      status: 'ok',
    };
  }

  /**
   * Liveness and dependency check. Returns 503 when the database is
   * unreachable; Redis only affects push notifications, so it degrades.
   */
  @Get('health')
  async health(@Res({ passthrough: true }) res: Response) {
    const [database, redis] = await Promise.all([this.databaseHealthy(), this.notificationQueue.isHealthy()]);
    const status = !database ? 'down' : redis ? 'ok' : 'degraded';
    if (!database) res.status(HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status,
      database: database ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
      timeZone: process.env.TZ ?? null,
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }

  private async databaseHealthy(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { NotificationQueueService } from './notifications/notification-queue.service';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = { query: jest.fn<(sql: string) => Promise<unknown>>() };
  const queue = { isHealthy: jest.fn<() => Promise<boolean>>() };
  const res = { status: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: NotificationQueueService, useValue: queue },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('returns the API status message', () => {
    expect(appController.getHello()).toEqual({
      message: 'Rwanda Utility Alerts API is running',
      status: 'ok',
    });
  });

  it('reports ok when database and redis are up', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    queue.isHealthy.mockResolvedValue(true);

    const result = await appController.health(res as any);

    expect(result).toMatchObject({ status: 'ok', database: 'up', redis: 'up' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 503 when the database is down', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));
    queue.isHealthy.mockResolvedValue(true);

    const result = await appController.health(res as any);

    expect(result).toMatchObject({ status: 'down', database: 'down' });
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('is degraded when only redis is down', async () => {
    dataSource.query.mockResolvedValue([]);
    queue.isHealthy.mockResolvedValue(false);

    expect(await appController.health(res as any)).toMatchObject({ status: 'degraded', redis: 'down' });
  });
});

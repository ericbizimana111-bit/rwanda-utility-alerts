import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

import { NotificationQueueService } from './notification-queue.service';
import { NotificationProcessor } from './notification.processor';
import {
    NOTIFICATION_QUEUE_NAME,
    PROCESS_OUTAGE_NOTIFICATIONS_JOB,
} from './notification-queue.constants';

describe('NotificationQueueService', () => {
    it('enqueues an outage notification job with retry settings', async () => {
        const add = jest.fn().mockResolvedValue({ id: 'job-1' });
        const service = new NotificationQueueService({ add } as any);

        await service.enqueueOutageNotification('outage-1');

        expect(add).toHaveBeenCalledWith(
            PROCESS_OUTAGE_NOTIFICATIONS_JOB,
            { outageId: 'outage-1' },
            expect.objectContaining({
                jobId: 'outage-notifications:outage-1',
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true,
                removeOnFail: false,
            }),
        );
        expect(NOTIFICATION_QUEUE_NAME).toBe('outage-notifications');
    });
});

describe('NotificationProcessor', () => {
    const validOutageId = '11111111-1111-4111-8111-111111111111';

    it('processes a valid outage job through the notification service', async () => {
        const createNotificationsForOutage = jest.fn().mockResolvedValue({
            outageId: 'outage-1',
            matchingUserCount: 2,
            notificationsCreated: 2,
            duplicatesSkipped: 0,
        });
        const processor = new NotificationProcessor({ createNotificationsForOutage } as any);

        const result = await processor.process({
            id: 'job-1',
            name: PROCESS_OUTAGE_NOTIFICATIONS_JOB,
            data: { outageId: validOutageId },
        } as any);

        expect(createNotificationsForOutage).toHaveBeenCalledWith(validOutageId);
        expect(result.notificationsCreated).toBe(2);
    });

    it('handles a nonexistent outage without retrying a permanently invalid job', async () => {
        const createNotificationsForOutage = jest.fn().mockRejectedValue(
            new NotFoundException('Outage not found'),
        );
        const processor = new NotificationProcessor({ createNotificationsForOutage } as any);

        const result = await processor.process({
            id: 'job-1',
            name: PROCESS_OUTAGE_NOTIFICATIONS_JOB,
            data: { outageId: 'missing-outage' },
        } as any);

        expect(result).toEqual(expect.objectContaining({
            outageId: 'missing-outage',
            skipped: true,
            notificationsCreated: 0,
        }));
    });

    it('rethrows transient failures so BullMQ can retry the job', async () => {
        const transientError = new Error('temporary database outage');
        const createNotificationsForOutage = jest.fn().mockRejectedValue(transientError);
        const processor = new NotificationProcessor({ createNotificationsForOutage } as any);

        await expect(
            processor.process({
                id: 'job-1',
                name: PROCESS_OUTAGE_NOTIFICATIONS_JOB,
                data: { outageId: validOutageId },
            } as any),
        ).rejects.toBe(transientError);
    });

    it('supports duplicate jobs by delegating repeatedly to idempotent matching', async () => {
        const createNotificationsForOutage = jest.fn()
            .mockResolvedValueOnce({ matchingUserCount: 1, notificationsCreated: 1, duplicatesSkipped: 0 })
            .mockResolvedValueOnce({ matchingUserCount: 1, notificationsCreated: 0, duplicatesSkipped: 1 });
        const processor = new NotificationProcessor({ createNotificationsForOutage } as any);
        const job = {
            id: 'job-1',
            name: PROCESS_OUTAGE_NOTIFICATIONS_JOB,
            data: { outageId: validOutageId },
        } as any;

        const first = await processor.process(job);
        const second = await processor.process(job);

        expect(first.notificationsCreated).toBe(1);
        expect(second.notificationsCreated).toBe(0);
        expect(second.duplicatesSkipped).toBe(1);
        expect(createNotificationsForOutage).toHaveBeenCalledTimes(2);
    });
});

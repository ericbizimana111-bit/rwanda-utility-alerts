import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
    NOTIFICATION_QUEUE_NAME,
    PROCESS_OUTAGE_NOTIFICATIONS_JOB,
} from './notification-queue.constants';

@Injectable()
export class NotificationQueueService {
    private readonly logger = new Logger(NotificationQueueService.name);

    constructor(
        @InjectQueue(NOTIFICATION_QUEUE_NAME)
        private readonly notificationQueue: Queue,
    ) { }

    /** True when Redis answers within the timeout. */
    async isHealthy(timeoutMs = 2000): Promise<boolean> {
        try {
            // A cheap read that round-trips to Redis.
            await Promise.race([
                this.notificationQueue.count(),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
            ]);
            return true;
        } catch {
            return false;
        }
    }

    async enqueueOutageNotification(outageId: string) {
        const job = await this.notificationQueue.add(
            PROCESS_OUTAGE_NOTIFICATIONS_JOB,
            { outageId },
            {
                // BullMQ rejects custom job IDs containing ':'.
                jobId: `outage-notifications-${outageId}`,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        this.logger.log(`notification job queued outageId=${outageId} jobId=${job.id}`);
        return job;
    }
}

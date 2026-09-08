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

    async enqueueOutageNotification(outageId: string) {
        const job = await this.notificationQueue.add(
            PROCESS_OUTAGE_NOTIFICATIONS_JOB,
            { outageId },
            {
                jobId: `outage-notifications:${outageId}`,
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

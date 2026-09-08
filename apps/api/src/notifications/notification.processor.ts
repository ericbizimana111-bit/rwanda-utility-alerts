import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import {
    NOTIFICATION_QUEUE_NAME,
    PROCESS_OUTAGE_NOTIFICATIONS_JOB,
} from './notification-queue.constants';

interface OutageNotificationJob {
    outageId: string;
}

@Injectable()
@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly pushNotificationService: PushNotificationService,
    ) {
        super();
    }

    async process(job: Job<OutageNotificationJob>) {
        if (job.name !== PROCESS_OUTAGE_NOTIFICATIONS_JOB) {
            throw new Error(`Unsupported notification job: ${job.name}`);
        }

        const { outageId } = job.data;
        this.logger.log(`notification job started outageId=${outageId} jobId=${job.id}`);

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(outageId)) {
            this.logger.warn(`notification job skipped invalid outageId=${outageId}`);
            return {
                outageId,
                matchingSubscriptions: 0,
                matchingUserCount: 0,
                notificationsCreated: 0,
                duplicatesSkipped: 0,
                skipped: true,
            };
        }

        try {
            const result = await this.notificationsService.createNotificationsForOutage(outageId);
            let pushResults = 0;
            for (const notification of result.notifications ?? []) {
                try {
                    pushResults += (await this.pushNotificationService.deliverNotification(notification.id)).length;
                } catch (error) {
                    this.logger.error(
                        `push processing failed outageId=${outageId} notificationId=${notification.id}: ${(error as Error).message}`,
                    );
                }
            }
            this.logger.log(
                `notification job completed outageId=${outageId} matchedUsers=${result.matchingUserCount} notificationsCreated=${result.notificationsCreated} pushResults=${pushResults} duplicatesSkipped=${result.duplicatesSkipped ?? 0}`,
            );
            return result;
        } catch (error) {
            if ((error as { status?: number }).status === 404) {
                this.logger.warn(`notification job skipped missing outageId=${outageId}`);
                return {
                    outageId,
                    matchingSubscriptions: 0,
                    notificationsCreated: 0,
                    duplicatesSkipped: 0,
                    skipped: true,
                };
            }

            this.logger.error(
                `notification job failed outageId=${outageId}: ${(error as Error).message}`,
                (error as Error).stack,
            );
            throw error;
        }
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<OutageNotificationJob> | undefined, error: Error) {
        this.logger.error(
            `notification job failed permanently outageId=${job?.data?.outageId ?? 'unknown'} jobId=${job?.id ?? 'unknown'}: ${error.message}`,
        );
    }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { Outage } from '../outages/outage.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Device } from '../devices/device.entity';
import { NOTIFICATION_QUEUE_NAME } from './notification-queue.constants';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationProcessor } from './notification.processor';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE_NAME }),
    TypeOrmModule.forFeature([
      Notification,
      User,
      Outage,
      Subscription,
      Device,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationQueueService,
    NotificationProcessor,
    PushNotificationService,
  ],
  exports: [NotificationsService, NotificationQueueService],
})
export class NotificationsModule { }
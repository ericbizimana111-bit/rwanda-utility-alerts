import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { Outage } from '../outages/outage.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Device } from '../devices/device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      User,
      Outage,
      Subscription,
      Device,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
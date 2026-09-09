import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Outage } from '../outages/outage.entity';
import { Report } from '../reports/report.entity';
import { Notification } from '../notifications/notification.entity';
import { Device } from '../devices/device.entity';
import { DataSource } from '../data-sources/data-source.entity';
import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subscription, Outage, Report, Notification, Device, DataSource, Location, Utility])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OutagesController } from './outages.controller';
import { OutagesService } from './outages.service';
import { OutageLifecycleService } from './outage-lifecycle.service';
import { Outage } from './outage.entity';
import { OutageLocation } from './outage-location.entity';

import { Utility } from '../utilities/utility.entity';
import { Location } from '../locations/location.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Outage,
      OutageLocation,
      Utility,
      Location,
    ]),
    NotificationsModule,
  ],
  controllers: [OutagesController],
  providers: [OutagesService, OutageLifecycleService],
  exports: [OutagesService],
})
export class OutagesModule { }
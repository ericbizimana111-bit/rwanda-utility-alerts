import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './subscription.entity';

import { User } from '../users/user.entity';
import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      User,
      Location,
      Utility,
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
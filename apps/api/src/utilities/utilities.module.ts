import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';
import { UtilitiesSeed } from './utilities.seed';
import { Utility } from './utility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utility]),
  ],
  controllers: [UtilitiesController],
  providers: [
    UtilitiesService,
    UtilitiesSeed,
  ],
  exports: [UtilitiesService],
})
export class UtilitiesModule { }
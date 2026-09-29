import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LocationsSeed } from './locations.seed';
import { Location } from './location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationsSeed],
  exports: [LocationsService],
})
export class LocationsModule { }
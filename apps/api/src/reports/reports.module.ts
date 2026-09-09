import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './report.entity';
import { User } from '../users/user.entity';
import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Location, Utility])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }
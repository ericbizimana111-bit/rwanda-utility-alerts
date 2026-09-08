import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OutagesModule } from './outages/outages.module';
import { DevicesModule } from './devices/devices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60,
        limit: 20,
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT || 5433),
      username: process.env.DATABASE_USER || 'utility_admin',
      password: process.env.DATABASE_PASSWORD || 'utility_password',
      database: process.env.DATABASE_NAME || 'utility_alerts',
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsersModule,
    LocationsModule,
    UtilitiesModule,
    SubscriptionsModule,
    OutagesModule,
    DevicesModule,
    NotificationsModule,
    ReportsModule,
    AuthModule,
    DataSourcesModule,
    AdminModule,
  ],

  controllers: [AppController],
})
export class AppModule { }
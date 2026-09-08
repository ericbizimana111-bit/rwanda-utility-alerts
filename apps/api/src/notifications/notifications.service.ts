import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { Outage } from '../outages/outage.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Device } from '../devices/device.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,

        @InjectRepository(Outage)
        private readonly outagesRepository: Repository<Outage>,

        @InjectRepository(Subscription)
        private readonly subscriptionsRepository: Repository<Subscription>,

        @InjectRepository(Device)
        private readonly devicesRepository: Repository<Device>,
    ) { }

    async createNotification(
        userId: string,
        outageId: string,
    ) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const outage = await this.outagesRepository.findOne({
            where: { id: outageId },
            relations: {
                utility: true,
                location: true,
            },
        });

        if (!outage) {
            throw new NotFoundException('Outage not found');
        }

        const existing =
            await this.notificationsRepository.findOne({
                where: {
                    userId,
                    outageId,
                },
            });

        if (existing) {
            return existing;
        }

        const notification =
            this.notificationsRepository.create({
                userId,
                outageId,
                title: outage.title,
                message: this.buildMessage(outage),
                status: 'pending',
                isRead: false,
            });

        return this.notificationsRepository.save(
            notification,
        );
    }

    private buildMessage(outage: Outage): string {
        const location = outage.location;

        const locationParts = [
            location?.district,
            location?.sector,
            location?.cell,
        ].filter(Boolean);

        const locationText =
            locationParts.length > 0
                ? locationParts.join(', ')
                : 'your area';

        const start = outage.startTime
            ? outage.startTime.toLocaleString('en-RW')
            : 'an unspecified time';

        const end = outage.endTime
            ? outage.endTime.toLocaleString('en-RW')
            : 'an unspecified time';

        return `${outage.utility.name} interruption in ${locationText}. Expected from ${start} to ${end}.`;
    }

    async getUserNotifications(userId: string) {
        return this.notificationsRepository.find({
            where: {
                userId,
            },
            relations: {
                outage: {
                    utility: true,
                    location: true,
                },
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async markAsRead(
        userId: string,
        notificationId: string,
    ) {
        const notification =
            await this.notificationsRepository.findOne({
                where: {
                    id: notificationId,
                    userId,
                },
            });

        if (!notification) {
            throw new NotFoundException(
                'Notification not found',
            );
        }

        notification.isRead = true;

        return this.notificationsRepository.save(
            notification,
        );
    }

    async createNotificationsForOutage(
        outageId: string,
    ) {
        const outage = await this.outagesRepository.findOne({
            where: {
                id: outageId,
            },
        });

        if (!outage) {
            throw new NotFoundException(
                'Outage not found',
            );
        }

        const locationIds = outage.locationId
            ? [outage.locationId]
            : [];

        const subscriptions =
            await this.subscriptionsRepository.find({
                where: locationIds.length > 0
                    ? {
                        locationId: locationIds[0],
                        utilityId: outage.utilityId,
                        isActive: true,
                    }
                    : undefined,
            });

        const notifications: Notification[] = [];

        for (const subscription of subscriptions) {
            const notification =
                await this.createNotification(
                    subscription.userId,
                    outage.id,
                );

            notifications.push(notification);
        }

        return {
            outageId,
            notificationsCreated: notifications.length,
            notifications,
        };
    }

    async getUserDevices(userId: string) {
        return this.devicesRepository.find({
            where: {
                userId,
                isActive: true,
            },
        });
    }
}
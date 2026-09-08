import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

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
    ): Promise<Notification | null> {
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
                outageLocations: { location: true },
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

        if (!user.notificationsEnabled) {
            return null;
        }

        const notification =
            this.notificationsRepository.create({
                userId,
                outageId,
                title: outage.title,
                message: this.buildMessage(outage),
                status: 'queued',
                isRead: false,
            });

        try {
            return await this.notificationsRepository.save(notification);
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505'
            ) {
                return this.notificationsRepository.findOne({
                    where: { userId, outageId },
                });
            }

            throw error;
        }
    }

    private buildMessage(outage: Outage): string {
        const locationTexts = Array.from(
            new Set(
                (outage.outageLocations ?? [])
                    .map(({ location }) =>
                        [
                            location?.district,
                            location?.sector,
                            location?.cell,
                            location?.village,
                        ]
                            .filter(Boolean)
                            .join(', '),
                    )
                    .filter(Boolean),
            ),
        );

        const locationText = locationTexts.length > 0
            ? locationTexts.join('; ')
            : 'the affected locations';

        const start = outage.startTime
            ? outage.startTime.toLocaleString('en-RW')
            : 'an unspecified start time';
        const end = outage.endTime
            ? ` until ${outage.endTime.toLocaleString('en-RW')}`
            : '';
        const reason = outage.description ? ` Reason: ${outage.description}` : '';
        const source = outage.sourceName
            ? ` Source: ${outage.sourceName}${outage.sourceUrl ? ` (${outage.sourceUrl})` : ''}.`
            : '';

        return `${outage.utility.name} outage in ${locationText}. ${outage.title}.${reason} Expected from ${start}${end}.${source}`;
    }

    async getUserNotifications(userId: string) {
        return this.notificationsRepository.find({
            where: {
                userId,
            },
            relations: {
                outage: {
                    utility: true,
                    outageLocations: { location: true },
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
            relations: {
                utility: true,
                outageLocations: { location: true },
            },
        });

        if (!outage) {
            throw new NotFoundException(
                'Outage not found',
            );
        }

        const locationIds = Array.from(
            new Set(
                (outage.outageLocations ?? [])
                    .map((outageLocation) => outageLocation.locationId)
                    .filter(Boolean),
            ),
        );

        if (!locationIds.length) {
            return {
                outageId,
                matchingSubscriptions: 0,
                matchingUserCount: 0,
                notificationsCreated: 0,
                duplicatesSkipped: 0,
                notifications: [],
            };
        }

        const subscriptions = await this.subscriptionsRepository
            .createQueryBuilder('subscription')
            .innerJoinAndSelect('subscription.user', 'user')
            .where('subscription.isActive = :isActive', { isActive: true })
            .andWhere('subscription.utilityId = :utilityId', { utilityId: outage.utilityId })
            .andWhere('subscription.locationId IN (:...locationIds)', { locationIds })
            .andWhere('user.notificationsEnabled = :notificationsEnabled', { notificationsEnabled: true })
            .getMany();

        const matchingUserIds = Array.from(
            new Set(subscriptions.map((subscription) => subscription.userId)),
        );

        const notifications: Notification[] = [];
        let notificationsCreated = 0;
        let duplicatesSkipped = 0;

        for (const userId of matchingUserIds) {
            const existing = await this.notificationsRepository.findOne({
                where: {
                    userId,
                    outageId,
                },
            });

            if (existing) {
                duplicatesSkipped += 1;
                if (existing.status !== 'sent') {
                    notifications.push(existing);
                }
                continue;
            }

            const notification =
                await this.createNotification(
                    userId,
                    outage.id,
                );

            if (notification) {
                notifications.push(notification);
                if (!existing) {
                    notificationsCreated += 1;
                }
            }
        }

        return {
            outageId,
            matchingSubscriptions: subscriptions.length,
            matchingUserCount: matchingUserIds.length,
            notificationsCreated,
            duplicatesSkipped,
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
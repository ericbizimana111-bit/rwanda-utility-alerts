import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';

import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { Outage } from '../outages/outage.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Device } from '../devices/device.entity';
import { Location } from '../locations/location.entity';
import { formatKigaliRange } from '../common/kigali-time';

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

        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
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
        // Group affected areas by district: "Kicukiro: Niboye, Kagarama; Gasabo: Remera".
        const areasByDistrict = new Map<string, Set<string>>();
        for (const { location } of outage.outageLocations ?? []) {
            if (!location?.district) continue;
            const areas = areasByDistrict.get(location.district) ?? new Set<string>();
            const detail = [location.sector, location.cell, location.village].filter(Boolean).join(', ');
            if (detail) areas.add(detail);
            areasByDistrict.set(location.district, areas);
        }

        const locationText = areasByDistrict.size > 0
            ? Array.from(areasByDistrict.entries())
                .map(([district, areas]) =>
                    areas.size ? `${district}: ${Array.from(areas).join(', ')}` : district)
                .join('; ')
            : 'the affected areas';

        const when = formatKigaliRange(outage.startTime, outage.endTime) ?? 'Time to be announced';
        const reason = outage.description ? ` ${outage.description.trim().replace(/\.?$/, '.')}` : '';
        const source = outage.sourceName ? ` Source: ${outage.sourceName}.` : '';

        return `${outage.utility.name} interruption in ${locationText}. ${when}.${reason}${source}`;
    }

    /**
     * Location IDs whose subscribers are affected by an outage, following the
     * administrative hierarchy: a district-wide outage reaches every
     * subscriber in that district, and a sector outage also reaches
     * subscribers who follow the whole district.
     */
    private async expandAffectedLocationIds(outage: Outage): Promise<string[]> {
        const affected = (outage.outageLocations ?? []).filter((item) => item.locationId);
        const ids = new Set(affected.map((item) => item.locationId));
        const affectedLocations = affected
            .map((item) => item.location)
            .filter((location): location is Location => Boolean(location?.district));

        const districts = Array.from(new Set(affectedLocations.map((location) => location.district)));
        if (!districts.length || !this.locationsRepository) return Array.from(ids);

        const candidates = await this.locationsRepository.find({
            where: { district: In(districts) },
        });

        const same = (a?: string | null, b?: string | null) =>
            (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

        for (const candidate of candidates) {
            const covered = affectedLocations.some((area) => {
                if (!same(area.district, candidate.district)) return false;
                if (!area.sector || !candidate.sector) return true;
                if (!same(area.sector, candidate.sector)) return false;
                return !area.cell || !candidate.cell || same(area.cell, candidate.cell);
            });
            if (covered) ids.add(candidate.id);
        }

        return Array.from(ids);
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

        const locationIds = await this.expandAffectedLocationIds(outage);

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
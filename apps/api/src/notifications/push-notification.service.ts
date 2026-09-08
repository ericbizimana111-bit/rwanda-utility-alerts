import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Device } from '../devices/device.entity';
import { Notification } from './notification.entity';
import { Outage } from '../outages/outage.entity';

export type PushDeliveryResult =
    | { status: 'sent'; deviceId: string }
    | { status: 'failed'; deviceId: string; permanent: boolean; error: string }
    | { status: 'skipped'; deviceId: string; error: string };

interface ExpoTicket {
    status?: string;
    id?: string;
    message?: string;
    details?: { error?: string };
}

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);
    private readonly expoUrl = process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push/send';

    constructor(
        @InjectRepository(Device)
        private readonly devicesRepository: Repository<Device>,
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,
        @InjectRepository(Outage)
        private readonly outagesRepository: Repository<Outage>,
    ) { }

    isValidExpoToken(token: string): boolean {
        return /^(Expo(nent)?PushToken)\[[^\]]+\]$/.test(token);
    }

    async deliverNotification(notificationId: string): Promise<PushDeliveryResult[]> {
        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId },
        });

        if (!notification) {
            this.logger.warn(`push skipped missing notificationId=${notificationId}`);
            return [];
        }

        const outage = await this.outagesRepository.findOne({
            where: { id: notification.outageId },
            relations: {
                utility: true,
                outageLocations: { location: true },
            },
        });

        if (!outage) {
            await this.notificationsRepository.update(notification.id, { status: 'failed' });
            return [];
        }

        const devices = await this.devicesRepository.find({
            where: {
                userId: notification.userId,
                isActive: true,
            },
        });

        if (!devices.length) {
            this.logger.log(`push skipped no active devices userId=${notification.userId} outageId=${notification.outageId}`);
            return [];
        }

        await this.notificationsRepository.update(notification.id, { status: 'sending' });
        const results: PushDeliveryResult[] = [];

        for (const device of devices) {
            if (!this.isValidExpoToken(device.pushToken)) {
                const error = 'Invalid Expo push token format';
                await this.markDeviceFailed(device, notification, error, true);
                results.push({ status: 'skipped', deviceId: device.id, error });
                continue;
            }

            try {
                const ticket = await this.sendExpoMessage({
                    to: device.pushToken,
                    title: notification.title,
                    body: notification.message,
                    data: {
                        type: 'outage',
                        outageId: outage.id,
                        utility: outage.utility.code,
                        locations: (outage.outageLocations ?? []).map(({ location }) => ({
                            district: location?.district,
                            sector: location?.sector,
                            cell: location?.cell,
                            village: location?.village,
                        })),
                    },
                });

                if (ticket.status === 'ok') {
                    results.push({ status: 'sent', deviceId: device.id });
                    this.logger.log(`push accepted userId=${notification.userId} deviceId=${device.id} outageId=${notification.outageId} provider=expo`);
                    continue;
                }

                const error = ticket.details?.error || ticket.message || 'Expo rejected push ticket';
                const permanent = error === 'DeviceNotRegistered';
                await this.markDeviceFailed(device, notification, error, permanent);
                results.push({ status: 'failed', deviceId: device.id, permanent, error });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await this.markDeviceFailed(device, notification, message, false);
                results.push({ status: 'failed', deviceId: device.id, permanent: false, error: message });
            }
        }

        const sent = results.some((result) => result.status === 'sent');
        await this.notificationsRepository.update(notification.id, {
            status: sent ? 'sent' : 'failed',
            sentAt: sent ? new Date() : null,
        });

        return results;
    }

    private async sendExpoMessage(message: Record<string, unknown>): Promise<ExpoTicket> {
        const response = await fetch(this.expoUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`Expo HTTP ${response.status}`);
        }

        const body = await response.json() as { data?: ExpoTicket | ExpoTicket[] };
        const ticket = Array.isArray(body.data) ? body.data[0] : body.data;
        if (!ticket) {
            throw new Error('Expo response did not contain a ticket');
        }

        return ticket;
    }

    private async markDeviceFailed(
        device: Device,
        notification: Notification,
        error: string,
        permanent: boolean,
    ) {
        if (permanent) {
            device.isActive = false;
            await this.devicesRepository.save(device);
        }

        this.logger.error(
            `push delivery failed userId=${notification.userId} deviceId=${device.id} outageId=${notification.outageId} provider=expo error=${error} timestamp=${new Date().toISOString()}`,
        );
    }
}

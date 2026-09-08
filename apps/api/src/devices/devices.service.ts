import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Device } from './device.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DevicesService {
    constructor(
        @InjectRepository(Device)
        private readonly devicesRepository: Repository<Device>,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async registerDevice(
        userId: string,
        pushToken: string,
        platform?: string,
    ) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(
                'User not found',
            );
        }

        const existing =
            await this.devicesRepository.findOne({
                where: {
                    pushToken,
                },
            });

        if (existing) {
            existing.userId = userId;
            existing.platform = platform ?? null;
            existing.isActive = true;

            return this.devicesRepository.save(existing);
        }

        const device = this.devicesRepository.create({
            userId,
            pushToken,
            platform: platform ?? null,
            isActive: true,
        });

        return this.devicesRepository.save(device);
    }

    async getUserDevices(userId: string) {
        return this.devicesRepository.find({
            where: {
                userId,
                isActive: true,
            },
        });
    }

    async deactivateDevice(
        userId: string,
        deviceId: string,
    ) {
        const device =
            await this.devicesRepository.findOne({
                where: {
                    id: deviceId,
                    userId,
                },
            });

        if (!device) {
            throw new NotFoundException(
                'Device not found',
            );
        }

        device.isActive = false;

        return this.devicesRepository.save(device);
    }
}
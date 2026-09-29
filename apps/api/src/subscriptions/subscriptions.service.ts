import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from './subscription.entity';
import { User } from '../users/user.entity';
import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionsRepository: Repository<Subscription>,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,

        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,

        @InjectRepository(Utility)
        private readonly utilitiesRepository: Repository<Utility>,
    ) { }

    async create(
        userId: string,
        locationId: string,
        utilityId: string,
    ) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const location = await this.locationsRepository.findOne({
            where: { id: locationId },
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        const utility = await this.utilitiesRepository.findOne({
            where: { id: utilityId },
        });

        if (!utility) {
            throw new NotFoundException('Utility not found');
        }

        const existingSubscription =
            await this.subscriptionsRepository.findOne({
                where: {
                    userId,
                    locationId,
                    utilityId,
                },
            });

        if (existingSubscription?.isActive) {
            throw new ConflictException(
                'You are already subscribed to this utility and location',
            );
        }

        // Removing a subscription only deactivates it, so re-subscribing
        // reactivates the same row instead of creating a duplicate.
        const subscription = existingSubscription
            ? Object.assign(existingSubscription, { isActive: true })
            : this.subscriptionsRepository.create({
                userId,
                locationId,
                utilityId,
                isActive: true,
            });

        const saved = await this.subscriptionsRepository.save(subscription);

        return this.subscriptionsRepository.findOne({
            where: { id: saved.id },
            relations: { location: true, utility: true },
        });
    }

    async findUserSubscriptions(userId: string) {
        return this.subscriptionsRepository.find({
            where: {
                userId,
                isActive: true,
            },
            relations: {
                location: true,
                utility: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async remove(
        userId: string,
        subscriptionId: string,
    ) {
        const subscription =
            await this.subscriptionsRepository.findOne({
                where: {
                    id: subscriptionId,
                    userId,
                    isActive: true,
                },
            });

        if (!subscription) {
            throw new NotFoundException(
                'Subscription not found',
            );
        }

        subscription.isActive = false;

        return this.subscriptionsRepository.save(subscription);
    }

    async findMatchingSubscriptions(
        locationId: string,
        utilityId: string,
    ) {
        return this.subscriptionsRepository.find({
            where: {
                locationId,
                utilityId,
                isActive: true,
            },
            relations: {
                user: true,
                location: true,
                utility: true,
            },
        });
    }
}
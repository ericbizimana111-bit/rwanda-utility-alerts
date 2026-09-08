import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Outage } from './outage.entity';
import { OutageLocation } from './outage-location.entity';
import { Utility } from '../utilities/utility.entity';
import { Location } from '../locations/location.entity';
import { NotificationQueueService } from '../notifications/notification-queue.service';

@Injectable()
export class OutagesService {
    private static readonly VALID_STATUSES = ['planned', 'active', 'completed', 'cancelled'];

    constructor(
        @InjectRepository(Outage)
        private readonly outagesRepository: Repository<Outage>,

        @InjectRepository(OutageLocation)
        private readonly outageLocationsRepository: Repository<OutageLocation>,

        @InjectRepository(Utility)
        private readonly utilitiesRepository: Repository<Utility>,

        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,

        private readonly notificationQueueService: NotificationQueueService,
    ) { }

    private normalizeStatus(status?: string) {
        const normalized = (status ?? 'planned').toLowerCase();

        if (!OutagesService.VALID_STATUSES.includes(normalized)) {
            throw new BadRequestException(
                `Invalid outage status: ${status}. Allowed values: ${OutagesService.VALID_STATUSES.join(', ')}`,
            );
        }

        return normalized;
    }

    async create(data: {
        title: string;
        description?: string;
        utilityId: string;
        locationId?: string;
        locationIds?: string[];
        startTime: string | Date;
        endTime?: string | Date;
        status?: string;
        sourceType?: string;
        sourceName?: string | null;
        sourceUrl?: string | null;
        externalId: string;
    }) {
        const existingOutage = await this.outagesRepository.findOne({
            where: { externalId: data.externalId },
        });

        if (existingOutage) {
            throw new ConflictException('An outage with this external ID already exists');
        }

        const utility = await this.utilitiesRepository.findOne({
            where: { id: data.utilityId },
        });

        if (!utility) {
            throw new NotFoundException('Utility not found');
        }

        const locationIds = Array.from(
            new Set(
                [
                    ...(data.locationIds ?? []),
                    ...(data.locationId ? [data.locationId] : []),
                ].filter((id): id is string => Boolean(id)),
            ),
        );

        if (!locationIds.length) {
            throw new BadRequestException('At least one location is required for an outage');
        }

        for (const locationId of locationIds) {
            const location = await this.locationsRepository.findOne({ where: { id: locationId } });
            if (!location) {
                throw new NotFoundException(`Location not found: ${locationId}`);
            }
        }

        const primaryLocationId = locationIds[0];
        const status = this.normalizeStatus(data.status);

        const outage = this.outagesRepository.create({
            title: data.title,
            description: data.description ?? null,
            utilityId: data.utilityId,
            locationId: primaryLocationId,
            startTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime),
            endTime: data.endTime ? (data.endTime instanceof Date ? data.endTime : new Date(data.endTime)) : null,
            status,
            sourceType: data.sourceType ?? 'official',
            sourceName: data.sourceName ?? null,
            sourceUrl: data.sourceUrl ?? null,
            externalId: data.externalId,
        });

        const savedOutage = await this.outagesRepository.save(outage);

        for (const locationId of locationIds) {
            await this.outageLocationsRepository.save(
                this.outageLocationsRepository.create({
                    outageId: savedOutage.id,
                    locationId,
                }),
            );
        }

        await this.notificationQueueService.enqueueOutageNotification(savedOutage.id);

        return this.outagesRepository.findOne({
            where: { id: savedOutage.id },
            relations: {
                utility: true,
                location: true,
                outageLocations: { location: true },
            },
        });
    }

    async createFromCollector(payload: any) {
        const { title, utilityId, locationIds, locationId, startTime, endTime, status, sourceType, sourceName, sourceUrl, externalId, description } = payload;

        return this.create({
            title,
            description,
            utilityId,
            locationId,
            locationIds,
            startTime,
            endTime,
            status,
            sourceType,
            sourceName,
            sourceUrl,
            externalId,
        });
    }

    async findAll() {
        return this.outagesRepository.find({
            relations: {
                utility: true,
                location: true,
                outageLocations: { location: true },
            },
            order: {
                startTime: 'DESC',
            },
        });
    }

    async findById(id: string) {
        const outage = await this.outagesRepository.findOne({
            where: { id },
            relations: {
                utility: true,
                location: true,
                outageLocations: { location: true },
            },
        });

        if (!outage) {
            throw new NotFoundException('Outage not found');
        }

        return outage;
    }

    async findByUtility(utilityId: string) {
        return this.outagesRepository.find({
            where: { utilityId },
            relations: {
                utility: true,
                location: true,
                outageLocations: { location: true },
            },
            order: {
                startTime: 'DESC',
            },
        });
    }

    async findUpcoming() {
        return this.outagesRepository
            .createQueryBuilder('outage')
            .leftJoinAndSelect('outage.utility', 'utility')
            .leftJoinAndSelect('outage.location', 'location')
            .leftJoinAndSelect('outage.outageLocations', 'outageLocations')
            .leftJoinAndSelect('outageLocations.location', 'affectedLocation')
            .where('outage.startTime > :now', { now: new Date() })
            .andWhere('outage.status IN (:...statuses)', { statuses: ['planned', 'active'] })
            .orderBy('outage.startTime', 'ASC')
            .getMany();
    }

    async findActive() {
        const now = new Date();

        return this.outagesRepository
            .createQueryBuilder('outage')
            .leftJoinAndSelect('outage.utility', 'utility')
            .leftJoinAndSelect('outage.location', 'location')
            .leftJoinAndSelect('outage.outageLocations', 'outageLocations')
            .leftJoinAndSelect('outageLocations.location', 'affectedLocation')
            .where('outage.startTime <= :now', { now })
            .andWhere('outage.endTime >= :now OR outage.endTime IS NULL', { now })
            .orderBy('outage.startTime', 'ASC')
            .getMany();
    }
}
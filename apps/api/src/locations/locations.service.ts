import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Location } from './location.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
    ) { }

    async create(data: {
        province: string;
        district: string;
        sector?: string;
        cell?: string;
        village?: string;
    }) {
        const locationData = {
            province: data.province,
            district: data.district,
            sector: data.sector ?? null,
            cell: data.cell ?? null,
            village: data.village ?? null,
        };

        const districtLocations =
            await this.locationsRepository.find({
                where: {
                    province: locationData.province,
                    district: locationData.district,
                },
            });

        const existingLocation = districtLocations.find(
            (location) =>
                (location.sector ?? null) === locationData.sector &&
                (location.cell ?? null) === locationData.cell &&
                (location.village ?? null) === locationData.village,
        );

        if (existingLocation) {
            throw new ConflictException(
                'This location already exists',
            );
        }

        const location =
            this.locationsRepository.create(locationData);

        return this.locationsRepository.save(location);
    }

    async findAll() {
        return this.locationsRepository.find({
            order: {
                province: 'ASC',
                district: 'ASC',
                sector: 'ASC',
                cell: 'ASC',
                village: 'ASC',
            },
        });
    }

    async findById(id: string) {
        const location =
            await this.locationsRepository.findOne({
                where: { id },
            });

        if (!location) {
            throw new NotFoundException(
                'Location not found',
            );
        }

        return location;
    }

    async findByDistrict(district: string) {
        return this.locationsRepository.find({
            where: {
                district,
            },
            order: {
                sector: 'ASC',
                cell: 'ASC',
                village: 'ASC',
            },
        });
    }

    async findByProvince(province: string) {
        return this.locationsRepository.find({
            where: {
                province,
            },
            order: {
                district: 'ASC',
                sector: 'ASC',
                cell: 'ASC',
                village: 'ASC',
            },
        });
    }
}
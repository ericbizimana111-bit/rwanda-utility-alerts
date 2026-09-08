import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Utility } from './utility.entity';

@Injectable()
export class UtilitiesService {
    constructor(
        @InjectRepository(Utility)
        private readonly utilitiesRepository: Repository<Utility>,
    ) { }

    async create(data: {
        name: string;
        code: string;
        description?: string;
    }) {
        const existingUtility =
            await this.utilitiesRepository.findOne({
                where: [
                    { name: data.name },
                    { code: data.code },
                ],
            });

        if (existingUtility) {
            throw new ConflictException(
                'Utility with this name or code already exists',
            );
        }

        const utility =
            this.utilitiesRepository.create({
                ...data,
                isActive: true,
            });

        return this.utilitiesRepository.save(utility);
    }

    async findAll() {
        return this.utilitiesRepository.find({
            where: {
                isActive: true,
            },
            order: {
                name: 'ASC',
            },
        });
    }

    async findById(id: string) {
        const utility =
            await this.utilitiesRepository.findOne({
                where: { id },
            });

        if (!utility) {
            throw new NotFoundException(
                'Utility not found',
            );
        }

        return utility;
    }

    async findByCode(code: string) {
        const utility =
            await this.utilitiesRepository.findOne({
                where: { code },
            });

        if (!utility) {
            throw new NotFoundException(
                'Utility not found',
            );
        }

        return utility;
    }
}
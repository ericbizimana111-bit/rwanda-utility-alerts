import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Utility } from './utility.entity';

@Injectable()
export class UtilitiesSeed implements OnModuleInit {
    constructor(
        @InjectRepository(Utility)
        private readonly utilitiesRepository: Repository<Utility>,
    ) { }

    async onModuleInit() {
        const utilities = [
            {
                name: 'Electricity',
                code: 'ELECTRICITY',
                description:
                    'Electricity interruption and restoration alerts',
            },
            {
                name: 'Water',
                code: 'WATER',
                description:
                    'Water interruption and restoration alerts',
            },
        ];

        for (const data of utilities) {
            const existing =
                await this.utilitiesRepository.findOne({
                    where: {
                        code: data.code,
                    },
                });

            if (!existing) {
                await this.utilitiesRepository.save(
                    this.utilitiesRepository.create({
                        ...data,
                        isActive: true,
                    }),
                );
            }
        }
    }
}
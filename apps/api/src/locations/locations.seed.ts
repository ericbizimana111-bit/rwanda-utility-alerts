import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Location } from './location.entity';
import { RWANDA_DIVISIONS } from './rwanda-administrative-divisions';

/**
 * Seeds one district-level location (sector = null) for each of Rwanda's 30
 * districts plus one location per sector. Idempotent: existing rows are
 * matched on district + sector, so re-running never creates duplicates.
 */
@Injectable()
export class LocationsSeed implements OnModuleInit {
    private readonly logger = new Logger(LocationsSeed.name);

    constructor(
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
    ) { }

    async onModuleInit() {
        const existing = await this.locationsRepository.find();
        const key = (district: string, sector: string | null) =>
            `${district.toLowerCase()}|${(sector ?? '').toLowerCase()}`;
        const existingKeys = new Set(
            existing
                .filter((location) => !location.cell && !location.village)
                .map((location) => key(location.district, location.sector)),
        );

        const missing: Array<Pick<Location, 'province' | 'district' | 'sector' | 'cell' | 'village'>> = [];

        for (const [province, districts] of Object.entries(RWANDA_DIVISIONS)) {
            for (const [district, sectors] of Object.entries(districts)) {
                for (const sector of [null, ...sectors]) {
                    if (existingKeys.has(key(district, sector))) continue;
                    missing.push({ province, district, sector, cell: null, village: null });
                }
            }
        }

        if (!missing.length) return;

        await this.locationsRepository.save(
            missing.map((location) => this.locationsRepository.create(location)),
            { chunk: 100 },
        );
        this.logger.log(`Seeded ${missing.length} Rwanda locations`);
    }
}

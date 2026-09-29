import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Location } from './location.entity';
import { RWANDA_DIVISIONS } from './rwanda-administrative-divisions';

/** Comparison key tolerant of Kinyarwanda r/l spelling variants (Nyakariro / Nyakaliro). */
const nameKey = (value: string | null | undefined) => (value ?? '').trim().toLowerCase().replace(/l/g, 'r');

/**
 * Seeds one district-level location (sector = null) for each of Rwanda's 30
 * districts plus one location per sector. Idempotent: existing rows are
 * matched on district + sector, so re-running never creates duplicates.
 * Existing rows spelled with an r/l variant are renamed to the official
 * spelling (keeping their IDs, so subscriptions and outages stay linked).
 */
@Injectable()
export class LocationsSeed implements OnModuleInit {
    private readonly logger = new Logger(LocationsSeed.name);

    constructor(
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
    ) { }

    async onModuleInit() {
        const existing = (await this.locationsRepository.find()).filter((location) => !location.cell && !location.village);
        const byKey = new Map<string, Location[]>();
        for (const location of existing) {
            const key = `${nameKey(location.district)}|${nameKey(location.sector)}`;
            byKey.set(key, [...(byKey.get(key) ?? []), location]);
        }

        const missing: Location[] = [];
        const renamed: Location[] = [];

        for (const [province, districts] of Object.entries(RWANDA_DIVISIONS)) {
            for (const [district, sectors] of Object.entries(districts)) {
                for (const sector of [null, ...sectors]) {
                    const matches = byKey.get(`${nameKey(district)}|${nameKey(sector)}`) ?? [];
                    if (!matches.length) {
                        missing.push(this.locationsRepository.create({ province, district, sector, cell: null, village: null }));
                        continue;
                    }
                    const official = matches.find((location) => location.sector === sector && location.district === district);
                    if (!official && matches.length === 1) {
                        renamed.push(Object.assign(matches[0], { province, district, sector }));
                    } else if (official && official.province !== province) {
                        // e.g. older rows labelled "Kigali City" instead of "City of Kigali".
                        renamed.push(Object.assign(official, { province }));
                    }
                }
            }
        }

        if (renamed.length) {
            await this.locationsRepository.save(renamed);
            this.logger.log(`Corrected spelling of ${renamed.length} locations`);
        }
        if (missing.length) {
            await this.locationsRepository.save(missing, { chunk: 100 });
            this.logger.log(`Seeded ${missing.length} Rwanda locations`);
        }
    }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DataSource } from './data-source.entity';

/** Official sources the collector reads. */
export const OFFICIAL_SOURCES = [
    { name: 'REG', type: 'electricity', baseUrl: 'https://www.reg.rw/customer-service/power-outages/' },
    { name: 'WASAC', type: 'water', baseUrl: 'https://www.wasac.rw/en/public-information/announcements' },
];

export type SourceReport = {
    name: string;
    type?: string;
    baseUrl?: string;
    success: boolean;
    itemCount?: number;
    error?: string | null;
};

@Injectable()
export class DataSourcesService implements OnModuleInit {
    constructor(
        @InjectRepository(DataSource)
        private readonly dataSourcesRepository: Repository<DataSource>,
    ) { }

    async onModuleInit() {
        for (const source of OFFICIAL_SOURCES) {
            const existing = await this.dataSourcesRepository.findOne({ where: { name: source.name } });
            if (!existing) {
                await this.dataSourcesRepository.save(this.dataSourcesRepository.create({ ...source, isActive: true }));
            }
        }
    }

    findAll() {
        return this.dataSourcesRepository.find({ order: { name: 'ASC' } });
    }

    /** Records the outcome of one collector check of a source. */
    async recordCheck(report: SourceReport) {
        const now = new Date();
        const source =
            (await this.dataSourcesRepository.findOne({ where: { name: report.name } })) ??
            this.dataSourcesRepository.create({
                name: report.name,
                type: report.type ?? 'unknown',
                baseUrl: report.baseUrl ?? '',
                isActive: true,
            });

        source.lastCheckedAt = now;
        if (report.baseUrl) source.baseUrl = report.baseUrl;
        if (report.success) {
            source.lastSuccessfulCheckAt = now;
            source.lastError = null;
            source.lastItemCount = report.itemCount ?? null;
        } else {
            source.lastError = (report.error ?? 'Unknown error').slice(0, 2000);
        }

        return this.dataSourcesRepository.save(source);
    }
}

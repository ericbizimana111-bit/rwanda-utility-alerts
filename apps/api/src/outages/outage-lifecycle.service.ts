import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { Outage } from './outage.entity';

/** Outages without a published end time are considered over after this long. */
export const OPEN_ENDED_OUTAGE_MS = 24 * 60 * 60 * 1000;
const INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keeps each outage's stored status in line with its published times:
 * planned -> active when it starts, planned/active -> completed when it ends.
 * Cancelled outages, and outages already completed by an admin, are left alone.
 */
@Injectable()
export class OutageLifecycleService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger = new Logger(OutageLifecycleService.name);
    private timer: NodeJS.Timeout | null = null;

    constructor(
        @InjectRepository(Outage)
        private readonly outagesRepository: Repository<Outage>,
    ) { }

    onApplicationBootstrap() {
        if (process.env.OUTAGE_LIFECYCLE_DISABLED === 'true') return;
        void this.run();
        this.timer = setInterval(() => void this.run(), INTERVAL_MS);
        this.timer.unref();
    }

    onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    async run(now: Date = new Date()) {
        try {
            const openEndedCutoff = new Date(now.getTime() - OPEN_ENDED_OUTAGE_MS);

            const completed = await this.outagesRepository
                .createQueryBuilder()
                .update(Outage)
                .set({ status: 'completed' })
                .where('status IN (:...statuses)', { statuses: ['planned', 'active'] })
                .andWhere(
                    new Brackets((qb) => {
                        qb.where('"endTime" IS NOT NULL AND "endTime" < :now', { now })
                            .orWhere('"endTime" IS NULL AND "startTime" < :openEndedCutoff', { openEndedCutoff });
                    }),
                )
                .execute();

            const started = await this.outagesRepository
                .createQueryBuilder()
                .update(Outage)
                .set({ status: 'active' })
                .where('status = :planned', { planned: 'planned' })
                .andWhere('"startTime" <= :now', { now })
                .execute();

            if (completed.affected || started.affected) {
                this.logger.log(`Outage statuses updated: ${started.affected ?? 0} started, ${completed.affected ?? 0} completed`);
            }
            return { started: started.affected ?? 0, completed: completed.affected ?? 0 };
        } catch (error) {
            this.logger.error(`Outage status update failed: ${(error as Error).message}`);
            return { started: 0, completed: 0 };
        }
    }
}

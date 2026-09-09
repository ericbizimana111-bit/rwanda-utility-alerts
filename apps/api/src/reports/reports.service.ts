import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { Location } from '../locations/location.entity';
import { Utility } from '../utilities/utility.entity';
import { Report } from './report.entity';
import { ReportStatus } from './dto/moderate-report.dto';

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report)
        private readonly reportsRepository: Repository<Report>,
        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
        @InjectRepository(Utility)
        private readonly utilitiesRepository: Repository<Utility>,
    ) { }

    async create(userId: string, data: { locationId: string; utilityId: string; description: string }) {
        const [location, utility] = await Promise.all([
            this.locationsRepository.findOne({ where: { id: data.locationId } }),
            this.utilitiesRepository.findOne({ where: { id: data.utilityId, isActive: true } }),
        ]);

        if (!location) throw new NotFoundException('Location not found');
        if (!utility) throw new NotFoundException('Utility not found');

        const normalizedDescription = this.normalizeDescription(data.description);
        const recentReports = await this.reportsRepository.find({
            where: {
                userId,
                locationId: data.locationId,
                utilityId: data.utilityId,
                createdAt: MoreThan(new Date(Date.now() - DUPLICATE_WINDOW_MS)),
            },
        });

        if (recentReports.some((report) => this.normalizeDescription(report.description) === normalizedDescription)) {
            throw new ConflictException('A similar report was submitted recently');
        }

        return this.reportsRepository.save(this.reportsRepository.create({
            userId,
            locationId: location.id,
            utilityId: utility.id,
            description: data.description.trim(),
            status: 'pending',
        }));
    }

    async findMine(userId: string) {
        return this.reportsRepository.find({
            where: { userId },
            relations: { location: true, utility: true },
            order: { createdAt: 'DESC' },
        });
    }

    async findById(reportId: string, userId: string, isAdmin: boolean) {
        const report = await this.reportsRepository.findOne({
            where: isAdmin ? { id: reportId } : { id: reportId, userId },
            relations: { location: true, utility: true, user: true },
        });

        if (!report) throw new NotFoundException('Report not found');
        return report;
    }

    async updateMine(userId: string, reportId: string, description: string) {
        const report = await this.reportsRepository.findOne({ where: { id: reportId, userId } });
        if (!report) throw new NotFoundException('Report not found');
        if (report.status !== 'pending') throw new ForbiddenException('Only pending reports can be edited');

        report.description = description.trim();
        return this.reportsRepository.save(report);
    }

    async findPending() {
        return this.reportsRepository.find({
            where: { status: 'pending' },
            relations: { location: true, utility: true, user: true },
            order: { createdAt: 'ASC' },
        });
    }

    async moderate(reportId: string, status: ReportStatus) {
        const report = await this.reportsRepository.findOne({ where: { id: reportId } });
        if (!report) throw new NotFoundException('Report not found');

        const allowedTransitions: Record<string, ReportStatus[]> = {
            pending: ['verified', 'rejected', 'resolved'],
            verified: ['rejected', 'resolved'],
            rejected: ['verified', 'resolved'],
            resolved: [],
        };

        const currentStatus = report.status as ReportStatus;
        if (currentStatus === 'resolved') {
            throw new ForbiddenException('Resolved reports cannot be moderated again.');
        }
        if (!allowedTransitions[currentStatus]?.includes(status)) {
            throw new ForbiddenException(
                `Invalid report transition from ${currentStatus} to ${status}.`,
            );
        }

        report.status = status;
        return this.reportsRepository.save(report);
    }

    private normalizeDescription(description: string) {
        return description.toLowerCase().replace(/\s+/g, ' ').trim();
    }
}

import { jest } from '@jest/globals';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';

import { CreateReportDto } from './dto/create-report.dto';
import { ModerateReportDto } from './dto/moderate-report.dto';
import { ReportsService } from './reports.service';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const locationId = '33333333-3333-4333-8333-333333333333';
const utilityId = '44444444-4444-4444-8444-444444444444';
const reportId = '55555555-5555-4555-8555-555555555555';

function createService(overrides: { reports?: any[]; location?: any; utility?: any } = {}) {
    const reports = overrides.reports ?? [];
    const matches = (report: any, where: any) => Object.entries(where).every(([key, value]: [string, any]) =>
        key === 'createdAt' && value?._type === 'moreThan'
            ? report[key] > value._value
            : report[key] === value,
    );
    const reportsRepository = {
        findOne: jest.fn(async ({ where }: any) => reports.find((report) => matches(report, where)) ?? null),
        find: jest.fn(async ({ where }: any = {}) => reports.filter((report) => matches(report, where))),
        create: jest.fn((data: any) => ({ id: reportId, createdAt: new Date(), ...data })),
        save: jest.fn(async (report: any) => report),
    };
    const locationsRepository = {
        findOne: jest.fn(async () => Object.prototype.hasOwnProperty.call(overrides, 'location') ? overrides.location : { id: locationId }),
    };
    const utilitiesRepository = {
        findOne: jest.fn(async () => Object.prototype.hasOwnProperty.call(overrides, 'utility') ? overrides.utility : { id: utilityId, isActive: true }),
    };
    return {
        service: new ReportsService(reportsRepository as any, locationsRepository as any, utilitiesRepository as any),
        reportsRepository,
        locationsRepository,
        utilitiesRepository,
    };
}

const createData = {
    locationId,
    utilityId,
    description: 'Water pipe is damaged near the market.',
};

describe('ReportsService', () => {
    it('creates an authenticated report using the supplied user identity', async () => {
        const { service, reportsRepository } = createService();
        const report = await service.create(userId, createData);

        expect(report).toEqual(expect.objectContaining({ userId, locationId, utilityId, status: 'pending' }));
        expect(reportsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ userId }));
    });

    it('rejects an invalid utility', async () => {
        const { service } = createService({ utility: null });
        await expect(service.create(userId, createData)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an invalid location', async () => {
        const { service } = createService({ location: null });
        await expect(service.create(userId, createData)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a recent duplicate report for the same user, utility, and location', async () => {
        const { service } = createService({
            reports: [{ userId, locationId, utilityId, description: createData.description, createdAt: new Date() }],
        });
        await expect(service.create(userId, createData)).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows a separate report from another user', async () => {
        const { service } = createService({
            reports: [{ userId: otherUserId, locationId, utilityId, description: createData.description, createdAt: new Date() }],
        });
        await expect(service.create(userId, createData)).resolves.toEqual(expect.objectContaining({ userId }));
    });

    it('returns only the authenticated user reports', async () => {
        const { service, reportsRepository } = createService();
        await service.findMine(userId);
        expect(reportsRepository.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId } }));
    });

    it('does not expose another user report through private lookup', async () => {
        const { service } = createService({ reports: [{ id: reportId, userId: otherUserId }] });
        await expect(service.findById(reportId, userId, false)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows an admin to view another user report', async () => {
        const { service } = createService({ reports: [{ id: reportId, userId: otherUserId }] });
        await expect(service.findById(reportId, userId, true)).resolves.toEqual(expect.objectContaining({ id: reportId }));
    });

    it('prevents a user from editing another user report', async () => {
        const { service } = createService({ reports: [{ id: reportId, userId: otherUserId, status: 'pending' }] });
        await expect(service.updateMine(userId, reportId, 'Updated report description.')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('prevents users from editing moderated reports', async () => {
        const { service } = createService({ reports: [{ id: reportId, userId, status: 'verified' }] });
        await expect(service.updateMine(userId, reportId, 'Updated report description.')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lists pending reports for moderators and changes status', async () => {
        const report = { id: reportId, userId, status: 'pending' };
        const { service } = createService({ reports: [report] });

        await expect(service.findPending()).resolves.toEqual([report]);
        await expect(service.moderate(reportId, 'verified')).resolves.toEqual(expect.objectContaining({ status: 'verified' }));
        await expect(service.moderate(reportId, 'rejected')).resolves.toEqual(expect.objectContaining({ status: 'rejected' }));
        await expect(service.moderate(reportId, 'resolved')).resolves.toEqual(expect.objectContaining({ status: 'resolved' }));
    });

    it('rejects invalid report UUIDs at DTO validation', async () => {
        const dto = Object.assign(new CreateReportDto(), {
            locationId: 'bad-location',
            utilityId: 'bad-utility',
            description: 'A valid length report description.',
        });
        const errors = await validate(dto);
        expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['locationId', 'utilityId']));
    });

    it('rejects invalid moderation status at DTO validation', async () => {
        const dto = Object.assign(new ModerateReportDto(), { status: 'pending-ish' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
    });
});

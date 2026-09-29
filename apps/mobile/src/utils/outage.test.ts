import type { Outage, Subscription } from '../api/client';
import {
    formatPhone,
    formatRelativeDay,
    formatTimeRange,
    isAllDay,
    isRwandanMobile,
    kinyarwandaGreeting,
} from './format';
import { areaSummary, outageAffectsSubscription, outageCountdown, outagePhase } from './outage';

function outage(overrides: Partial<Outage> = {}): Outage {
    return {
        id: 'o1',
        title: 'Planned electricity interruption in Kicukiro',
        status: 'planned',
        // 12:00–14:00 Kigali time (UTC+2) on Tue 29 Sep 2026.
        startTime: '2026-09-29T10:00:00.000Z',
        endTime: '2026-09-29T12:00:00.000Z',
        utility: { name: 'Electricity', code: 'ELECTRICITY' },
        outageLocations: [
            { location: { district: 'Kicukiro', sector: 'Niboye', cell: null } },
            { location: { district: 'Kicukiro', sector: 'Kagarama', cell: null } },
            { location: { district: 'Gasabo', sector: 'Remera', cell: null } },
        ],
        ...overrides,
    };
}

function subscription(district: string, sector: string | null, code = 'ELECTRICITY'): Subscription {
    return {
        id: `${district}-${sector}`,
        userId: 'u1',
        locationId: 'l1',
        utilityId: 'ut1',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        location: { id: 'l1', province: 'City of Kigali', district, sector, cell: null, village: null, createdAt: '', updatedAt: '' },
        utility: { id: 'ut1', name: code === 'WATER' ? 'Water' : 'Electricity', code, description: null, isActive: true, createdAt: '', updatedAt: '' },
    };
}

describe('Kigali time formatting', () => {
    it('shows times in Kigali time regardless of the device time zone', () => {
        expect(formatTimeRange('2026-09-29T10:00:00.000Z', '2026-09-29T12:00:00.000Z')).toBe('Tue, 29 Sep 2026 · 12:00 PM – 2:00 PM');
    });

    it('describes date-only announcements as all day', () => {
        // WASAC: 23 Sep 2026, 00:00 Kigali time, no published end.
        expect(isAllDay('2026-09-22T22:00:00.000Z', null)).toBe(true);
        expect(formatTimeRange('2026-09-22T22:00:00.000Z', null)).toBe('Wed, 23 Sep 2026 · All day');
    });

    it('labels an open-ended window with its start', () => {
        expect(formatTimeRange('2026-09-29T07:30:00.000Z', null)).toBe('Tue, 29 Sep 2026 · From 9:30 AM');
    });

    it('uses Kigali calendar days for today and tomorrow', () => {
        const now = new Date('2026-09-29T21:30:00.000Z'); // 23:30 in Kigali
        expect(formatRelativeDay(new Date('2026-09-29T22:30:00.000Z'), now)).toBe('Tomorrow');
        expect(formatRelativeDay(new Date('2026-09-29T08:00:00.000Z'), now)).toBe('Today');
    });

    it('greets in Kinyarwanda by Kigali time', () => {
        expect(kinyarwandaGreeting(new Date('2026-09-29T07:00:00.000Z'))).toBe('Mwaramutse');
        expect(kinyarwandaGreeting(new Date('2026-09-29T12:00:00.000Z'))).toBe('Mwiriwe');
    });
});

describe('phone numbers', () => {
    it('accepts MTN and Airtel numbers in local and international form', () => {
        expect(isRwandanMobile('078 812 3456')).toBe(true);
        expect(isRwandanMobile('+250 722 123 456')).toBe(true);
        expect(isRwandanMobile('0731234567')).toBe(true);
        expect(isRwandanMobile('0748123456')).toBe(false);
        expect(isRwandanMobile('12345')).toBe(false);
    });

    it('formats stored numbers for display', () => {
        expect(formatPhone('0788123456')).toBe('078 812 3456');
    });
});

describe('outage lifecycle', () => {
    it('derives the phase from the published times', () => {
        expect(outagePhase(outage(), new Date('2026-09-29T09:00:00.000Z'))).toBe('upcoming');
        expect(outagePhase(outage(), new Date('2026-09-29T11:00:00.000Z'))).toBe('active');
        expect(outagePhase(outage(), new Date('2026-09-29T13:00:00.000Z'))).toBe('ended');
        expect(outagePhase(outage({ status: 'cancelled' }), new Date('2026-09-29T11:00:00.000Z'))).toBe('cancelled');
    });

    it('treats open-ended outages as active for at most 24 hours', () => {
        const openEnded = outage({ endTime: null });
        expect(outagePhase(openEnded, new Date('2026-09-30T09:00:00.000Z'))).toBe('active');
        expect(outagePhase(openEnded, new Date('2026-09-30T11:00:00.000Z'))).toBe('ended');
    });

    it('produces a countdown before and during the outage', () => {
        expect(outageCountdown(outage(), new Date('2026-09-29T08:45:00.000Z'))).toBe('Starts in 1 h 15 min');
        expect(outageCountdown(outage(), new Date('2026-09-29T11:00:00.000Z'))).toBe('Expected back by 2:00 PM');
    });

    it('summarises areas by district', () => {
        expect(areaSummary(outage())).toBe('Kicukiro · Niboye, Kagarama   Gasabo · Remera');
    });
});

describe('matching followed areas', () => {
    it('matches the same sector and the whole district', () => {
        expect(outageAffectsSubscription(outage(), subscription('Kicukiro', 'Niboye'))).toBe(true);
        expect(outageAffectsSubscription(outage(), subscription('Gasabo', null))).toBe(true);
    });

    it('does not match other sectors, districts or utilities', () => {
        expect(outageAffectsSubscription(outage(), subscription('Kicukiro', 'Kanombe'))).toBe(false);
        expect(outageAffectsSubscription(outage(), subscription('Nyarugenge', null))).toBe(false);
        expect(outageAffectsSubscription(outage(), subscription('Kicukiro', 'Niboye', 'WATER'))).toBe(false);
    });

    it('reaches every sector when a whole district is affected', () => {
        const districtWide = outage({ outageLocations: [{ location: { district: 'Musanze', sector: null, cell: null } }] });
        expect(outageAffectsSubscription(districtWide, subscription('Musanze', 'Kinigi'))).toBe(true);
    });
});

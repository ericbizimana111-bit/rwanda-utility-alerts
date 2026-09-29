import type { Location, Outage, Subscription, Utility } from '../api/client';
import { colors } from '../theme/colors';
import { formatDuration, formatRelativeDay, formatClock, isAllDay, kigaliParts } from './format';

export type UtilityKind = 'electricity' | 'water';
export type OutagePhase = 'active' | 'upcoming' | 'ended' | 'cancelled';

/** Open-ended outages (no published end) are treated as active for 24 hours, matching the API. */
const OPEN_ENDED_MS = 24 * 60 * 60 * 1000;

export function utilityKind(utility?: Pick<Utility, 'code' | 'name'> | null): UtilityKind {
    const code = `${utility?.code ?? ''} ${utility?.name ?? ''}`.toLowerCase();
    return code.includes('water') ? 'water' : 'electricity';
}

export const UTILITY_THEME: Record<UtilityKind, { label: string; icon: 'lightning' | 'water'; color: string; bg: string; iconColor: string; provider: string }> = {
    electricity: {
        label: 'Electricity',
        icon: 'lightning',
        color: colors.electricity,
        bg: colors.electricityBg,
        iconColor: colors.electricityIcon,
        provider: 'REG',
    },
    water: {
        label: 'Water',
        icon: 'water',
        color: colors.water,
        bg: colors.waterBg,
        iconColor: colors.waterIcon,
        provider: 'WASAC',
    },
};

function time(iso: string | null | undefined): number | null {
    if (!iso) return null;
    const value = new Date(iso).getTime();
    return Number.isNaN(value) ? null : value;
}

/** Where an outage is in its lifecycle right now, derived from its published times. */
export function outagePhase(outage: Outage, now: Date = new Date()): OutagePhase {
    const status = (outage.status ?? '').toLowerCase();
    if (status === 'cancelled') return 'cancelled';
    if (status === 'completed' || status === 'resolved') return 'ended';

    const start = time(outage.startTime);
    const end = time(outage.endTime);
    const current = now.getTime();

    if (start !== null && current < start) return 'upcoming';
    if (end !== null) return current <= end ? 'active' : 'ended';
    if (start !== null) return current - start <= OPEN_ENDED_MS ? 'active' : 'ended';
    return 'upcoming';
}

export const PHASE_STYLE: Record<OutagePhase, { label: string; color: string; bg: string }> = {
    active: { label: 'In progress', color: colors.danger, bg: colors.dangerBg },
    upcoming: { label: 'Scheduled', color: colors.warning, bg: colors.warningBg },
    ended: { label: 'Ended', color: colors.success, bg: colors.successBg },
    cancelled: { label: 'Cancelled', color: colors.textSecondary, bg: colors.surfaceSubtle },
};

/** Short live status such as "Starts in 2 h 15 min" or "Ends at 2:00 PM". */
export function outageCountdown(outage: Outage, now: Date = new Date()): string | null {
    const phase = outagePhase(outage, now);
    const start = time(outage.startTime);
    const end = time(outage.endTime);

    const allDay = isAllDay(outage.startTime, outage.endTime);

    if (phase === 'upcoming' && start !== null) {
        const ms = start - now.getTime();
        const day = formatRelativeDay(new Date(start), now);
        if (allDay) return day === 'Today' || day === 'Tomorrow' ? `${day}, all day` : `In ${daysUntil(start, now)} days, all day`;
        if (ms < 12 * 60 * 60 * 1000) return `Starts in ${formatDuration(ms)}`;
        if (day === 'Today' || day === 'Tomorrow') return `${day} at ${formatClock(new Date(start))}`;
        return `Starts in ${daysUntil(start, now)} days`;
    }
    if (phase === 'active') {
        if (allDay) return 'Today, all day';
        if (end !== null) return `Expected back by ${formatClock(new Date(end))}`;
        return 'End time not announced';
    }
    return null;
}

/** Whole Kigali calendar days between now and a timestamp. */
function daysUntil(timestamp: number, now: Date): number {
    const day = (value: Date) => {
        const p = kigaliParts(value);
        return Date.UTC(p.year, p.month, p.day);
    };
    return Math.round((day(new Date(timestamp)) - day(now)) / (24 * 60 * 60 * 1000));
}

/** Planned duration, when both times are published. */
export function outageDuration(outage: Outage): string | null {
    const start = time(outage.startTime);
    const end = time(outage.endTime);
    if (start === null || end === null || end <= start) return null;
    return formatDuration(end - start);
}

/** Affected areas grouped by district, e.g. [{ district: 'Kicukiro', areas: ['Niboye', 'Kagarama'] }]. */
export function affectedAreasByDistrict(outage: Outage): Array<{ district: string; areas: string[] }> {
    const groups = new Map<string, Set<string>>();
    for (const { location } of outage.outageLocations ?? []) {
        if (!location?.district) continue;
        const areas = groups.get(location.district) ?? new Set<string>();
        const detail = [location.sector, location.cell].filter(Boolean).join(', ');
        if (detail) areas.add(detail);
        groups.set(location.district, areas);
    }
    return Array.from(groups.entries()).map(([district, areas]) => ({ district, areas: Array.from(areas) }));
}

/** One-line summary: "Kicukiro · Niboye, Kagarama +1  |  Gasabo". */
export function areaSummary(outage: Outage, maxAreas = 2): string | null {
    const groups = affectedAreasByDistrict(outage);
    if (!groups.length) return null;
    return groups
        .map(({ district, areas }) => {
            if (!areas.length) return district;
            const shown = areas.slice(0, maxAreas).join(', ');
            const more = areas.length > maxAreas ? ` +${areas.length - maxAreas}` : '';
            return `${district} · ${shown}${more}`;
        })
        .join('   ');
}

const same = (a?: string | null, b?: string | null) =>
    (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

/**
 * Whether an outage reaches a followed area, using the same administrative
 * hierarchy as the notification service: a district-wide outage reaches every
 * sector in it, and following a district covers all of its sectors.
 */
export function outageAffectsSubscription(outage: Outage, subscription: Subscription): boolean {
    if (subscription.utility && outage.utility && utilityKind(subscription.utility) !== utilityKind(outage.utility)) {
        return false;
    }
    const followed = subscription.location;
    if (!followed) return false;

    return (outage.outageLocations ?? []).some(({ location }) => {
        if (!location || !same(location.district, followed.district)) return false;
        if (!location.sector || !followed.sector) return true;
        if (!same(location.sector, followed.sector)) return false;
        return !location.cell || !followed.cell || same(location.cell, followed.cell);
    });
}

export function outagesForSubscriptions(outages: Outage[], subscriptions: Subscription[]): Outage[] {
    if (!subscriptions.length) return [];
    return outages.filter((outage) => subscriptions.some((subscription) => outageAffectsSubscription(outage, subscription)));
}

/** "Remera, Gasabo" or "Gasabo (whole district)". */
export function locationLabel(location?: Pick<Location, 'district' | 'sector' | 'cell'> | null): string {
    if (!location) return 'Unknown area';
    if (location.cell) return `${location.cell}, ${location.sector}, ${location.district}`;
    if (location.sector) return `${location.sector}, ${location.district}`;
    return `${location.district} (whole district)`;
}

/**
 * Date formatting in Rwanda time. Rwanda uses Central Africa Time, a fixed
 * UTC+2 offset with no daylight saving, so times are always shown exactly as
 * REG / WASAC publish them, whatever time zone the phone is set to.
 */
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function parse(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** Calendar fields of an instant as seen in Kigali. */
export function kigaliParts(date: Date) {
    const local = new Date(date.getTime() + KIGALI_OFFSET_MS);
    return {
        year: local.getUTCFullYear(),
        month: local.getUTCMonth(),
        day: local.getUTCDate(),
        weekday: local.getUTCDay(),
        hours: local.getUTCHours(),
        minutes: local.getUTCMinutes(),
    };
}

function dayKey(date: Date): string {
    const p = kigaliParts(date);
    return `${p.year}-${p.month}-${p.day}`;
}

export function formatClock(date: Date): string {
    const { hours, minutes } = kigaliParts(date);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${pad(minutes)} ${ampm}`;
}

/** "Tue, 29 Sep 2026" */
export function formatDay(date: Date): string {
    const p = kigaliParts(date);
    return `${DAYS[p.weekday]}, ${p.day} ${MONTHS[p.month]} ${p.year}`;
}

/** "Today", "Tomorrow", "Yesterday" or "Tue, 29 Sep 2026". */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
    const target = dayKey(date);
    const oneDay = 24 * 60 * 60 * 1000;
    if (target === dayKey(now)) return 'Today';
    if (target === dayKey(new Date(now.getTime() + oneDay))) return 'Tomorrow';
    if (target === dayKey(new Date(now.getTime() - oneDay))) return 'Yesterday';
    return formatDay(date);
}

/** Formats an ISO timestamp as "Tue, 29 Sep 2026 · 9:30 AM". Returns null for invalid input. */
export function formatDateTime(iso: string | null | undefined): string | null {
    const date = parse(iso);
    if (!date) return null;
    return `${formatDay(date)} · ${formatClock(date)}`;
}

/** True when a window starts at midnight and has no published end (WASAC day-long notices). */
export function isAllDay(startIso: string | null | undefined, endIso: string | null | undefined): boolean {
    const start = parse(startIso);
    if (!start) return false;
    const { hours, minutes } = kigaliParts(start);
    if (hours !== 0 || minutes !== 0) return false;
    const end = parse(endIso);
    if (!end) return true;
    const e = kigaliParts(end);
    return dayKey(start) === dayKey(end) && e.hours === 23 && e.minutes === 59;
}

/** "Tue, 29 Sep 2026 · 12:00 PM – 2:00 PM", or "… · All day", or "… · From 9:00 AM". */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string | null {
    const start = parse(startIso);
    if (!start) return null;
    if (isAllDay(startIso, endIso)) return `${formatDay(start)} · All day`;

    const end = parse(endIso);
    if (!end) return `${formatDay(start)} · From ${formatClock(start)}`;

    if (dayKey(start) === dayKey(end)) {
        return `${formatDay(start)} · ${formatClock(start)} – ${formatClock(end)}`;
    }
    return `${formatDateTime(startIso)} – ${formatDateTime(endIso)}`;
}

/** "2 h 30 min", "45 min", "3 days". */
export function formatDuration(ms: number): string {
    const minutes = Math.max(1, Math.round(ms / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 24) return rest ? `${hours} h ${rest} min` : `${hours} h`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
}

/** Relative label like "just now", "12 min ago", "3 h ago", "2 d ago". */
export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string | null {
    const date = parse(iso);
    if (!date) return null;

    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d ago`;
    return formatDay(date);
}

/** Kinyarwanda greeting for the time of day in Kigali. */
export function kinyarwandaGreeting(now: Date = new Date()): string {
    const { hours } = kigaliParts(now);
    return hours < 12 ? 'Mwaramutse' : 'Mwiriwe';
}

/** "078 812 3456" for a 07XXXXXXXX number; other values are returned unchanged. */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const match = /^0(7\d)(\d{3})(\d{4})$/.exec(phone);
    return match ? `0${match[1]} ${match[2]} ${match[3]}` : phone;
}

/** True for Rwandan mobile numbers (072/073 Airtel, 078/079 MTN), local or +250 form. */
export function isRwandanMobile(input: string): boolean {
    return /^(?:\+?250|0)?7[2389]\d{7}$/.test(input.replace(/[\s\-().]/g, ''));
}

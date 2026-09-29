// Rwanda uses Central Africa Time: a fixed UTC+2 offset with no daylight
// saving, so formatting by offset is exact and independent of ICU data.
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (value: number) => String(value).padStart(2, '0');

function kigaliParts(date: Date) {
    const local = new Date(date.getTime() + KIGALI_OFFSET_MS);
    return {
        day: `${DAYS[local.getUTCDay()]} ${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]} ${local.getUTCFullYear()}`,
        time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
    };
}

/**
 * Human-readable outage window in Rwanda time, e.g.
 * "Tue 29 Sep 2026, 12:00–14:00 (Kigali time)". Returns null without a start.
 */
export function formatKigaliRange(start: Date | null | undefined, end: Date | null | undefined): string | null {
    if (!start || Number.isNaN(start.getTime())) return null;

    const from = kigaliParts(start);

    if (!end || Number.isNaN(end.getTime())) {
        return `${from.day}, from ${from.time} (Kigali time)`;
    }

    const to = kigaliParts(end);

    if (from.day === to.day) {
        if (from.time === '00:00' && to.time === '23:59') return `${from.day}, all day`;
        return `${from.day}, ${from.time}–${to.time} (Kigali time)`;
    }

    return `${from.day} ${from.time} – ${to.day} ${to.time} (Kigali time)`;
}

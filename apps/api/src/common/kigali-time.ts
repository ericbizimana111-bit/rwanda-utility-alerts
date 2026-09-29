const TIME_ZONE = 'Africa/Kigali';

const dayFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

/**
 * Human-readable outage window in Rwanda time, e.g.
 * "Tue 29 Sep 2026, 12:00–14:00 (Kigali time)". Returns null without a start.
 */
export function formatKigaliRange(start: Date | null | undefined, end: Date | null | undefined): string | null {
    if (!start || Number.isNaN(start.getTime())) return null;

    const startDay = dayFormat.format(start);
    const startTime = timeFormat.format(start);

    if (!end || Number.isNaN(end.getTime())) {
        return `${startDay}, from ${startTime} (Kigali time)`;
    }

    const endDay = dayFormat.format(end);
    const endTime = timeFormat.format(end);

    if (startDay === endDay) {
        if (startTime === '00:00' && endTime === '23:59') return `${startDay}, all day`;
        return `${startDay}, ${startTime}–${endTime} (Kigali time)`;
    }

    return `${startDay} ${startTime} – ${endDay} ${endTime} (Kigali time)`;
}

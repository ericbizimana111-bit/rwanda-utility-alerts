const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

/** Formats an ISO timestamp as "Sep 15, 2026 · 9:30 AM". Returns null for invalid input. */
export function formatDateTime(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hour12}:${pad(date.getMinutes())} ${ampm}`;
}

/** Formats two timestamps as a range: "Sep 15, 2026 · 9:00 AM - 1:00 PM". */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string | null {
    const start = formatDateTime(startIso);
    if (!start) return null;
    const end = formatDateTime(endIso);
    if (!end) return start;

    const startParts = start.split(' · ');
    const endParts = end.split(' · ');
    if (startParts[0] === endParts[0]) {
        return `${startParts[0]} · ${startParts[1]} - ${endParts[1]}`;
    }
    return `${start} - ${end}`;
}

/** Relative label like "just now", "12 min ago", "3 h ago", "2 d ago". */
export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d ago`;
    return formatDateTime(iso);
}

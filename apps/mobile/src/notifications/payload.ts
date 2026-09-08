export type OutageNotificationPayload = {
    type: 'outage';
    outageId: string;
    utility?: string;
    locations?: unknown;
};

export function parseOutageNotificationData(data: unknown): OutageNotificationPayload | null {
    if (!data || typeof data !== 'object') return null;
    const value = data as Record<string, unknown>;
    if (value.type !== 'outage' || typeof value.outageId !== 'string' || !value.outageId) return null;
    return {
        type: 'outage',
        outageId: value.outageId,
        utility: typeof value.utility === 'string' ? value.utility : undefined,
        locations: value.locations,
    };
}

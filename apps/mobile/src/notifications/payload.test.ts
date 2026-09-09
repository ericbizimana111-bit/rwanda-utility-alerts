import { parseOutageNotificationData } from './payload';

describe('parseOutageNotificationData', () => {
    it('parses the backend outage payload', () => {
        expect(parseOutageNotificationData({ type: 'outage', outageId: 'outage-1', utility: 'ELECTRICITY' })).toEqual({
            type: 'outage',
            outageId: 'outage-1',
            utility: 'ELECTRICITY',
            locations: undefined,
        });
    });

    it('rejects malformed payloads', () => {
        expect(parseOutageNotificationData(null)).toBeNull();
        expect(parseOutageNotificationData({ type: 'outage' })).toBeNull();
        expect(parseOutageNotificationData({ type: 'other', outageId: 'outage-1' })).toBeNull();
    });
});

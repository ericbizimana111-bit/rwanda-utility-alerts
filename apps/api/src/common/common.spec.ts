import { normalizeRwandaPhone } from './phone';
import { formatKigaliRange } from './kigali-time';

describe('normalizeRwandaPhone', () => {
    it.each([
        ['0788123456', '0788123456'],
        ['078 812 3456', '0788123456'],
        ['+250788123456', '0788123456'],
        ['250 722-123-456', '0722123456'],
        ['0731234567', '0731234567'],
        ['0791234567', '0791234567'],
    ])('normalizes %s', (input, expected) => {
        expect(normalizeRwandaPhone(input)).toBe(expected);
    });

    it.each(['0748123456', '078812345', '+254712345678', 'abc', ''])('rejects %s', (input) => {
        expect(normalizeRwandaPhone(input)).toBeNull();
    });
});

describe('formatKigaliRange', () => {
    it('formats a same-day window in Kigali time (UTC+2)', () => {
        expect(formatKigaliRange(new Date('2026-09-29T10:00:00Z'), new Date('2026-09-29T12:00:00Z')))
            .toBe('Tue 29 Sep 2026, 12:00–14:00 (Kigali time)');
    });

    it('describes a full-day window as all day', () => {
        expect(formatKigaliRange(new Date('2026-09-22T22:00:00Z'), new Date('2026-09-23T21:59:00Z')))
            .toBe('Wed 23 Sep 2026, all day');
    });

    it('handles missing end and start times', () => {
        expect(formatKigaliRange(new Date('2026-09-29T07:30:00Z'), null)).toBe('Tue 29 Sep 2026, from 09:30 (Kigali time)');
        expect(formatKigaliRange(null, null)).toBeNull();
    });
});

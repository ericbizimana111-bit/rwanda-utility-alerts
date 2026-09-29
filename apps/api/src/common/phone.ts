/**
 * Rwandan mobile numbers: 07X XXX XXXX where the network prefix is
 * 072/073 (Airtel) or 078/079 (MTN). Accepts local (07...), international
 * (+2507... / 2507...) and spaced/dashed input.
 */
const RWANDA_MOBILE = /^(?:\+?250|0)?(7[2389]\d{7})$/;

/** Returns the canonical local form `07XXXXXXXX`, or null if not a Rwandan mobile number. */
export function normalizeRwandaPhone(input: string | null | undefined): string | null {
    if (!input) return null;
    const compact = input.replace(/[\s\-().]/g, '');
    const match = RWANDA_MOBILE.exec(compact);
    return match ? `0${match[1]}` : null;
}

/** 10.0.2.2 is the Android emulator's alias for the host PC; nothing else can reach it. */
const EMULATOR_ALIAS = '10.0.2.2';
const API_PORT = '3000';

export type ApiUrlContext = {
    platform: 'web' | 'android' | 'ios' | string;
    /** EXPO_PUBLIC_API_URL, if set. */
    configured?: string;
    /** Host name the web page was opened from (web only), e.g. "localhost". */
    pageHost?: string;
    /** False on emulators/simulators, true on real phones. */
    isDevice?: boolean;
    /** Host of the Metro dev server the app was loaded from, e.g. "10.12.73.126". */
    metroHost?: string;
};

/**
 * Chooses the API address for where the app is running:
 * - web: the configured URL, unless it is the emulator alias, then the page's own host;
 * - real phone in development: the configured URL, unless it is the emulator alias,
 *   then the PC running Metro (same Wi-Fi), so a changing PC IP needs no edits;
 * - emulator: the configured URL or 10.0.2.2.
 */
export function resolveApiUrl({ platform, configured, pageHost, isDevice, metroHost }: ApiUrlContext): string {
    const url = configured?.trim().replace(/\/+$/, '');
    const pointsAtEmulator = Boolean(url?.includes(EMULATOR_ALIAS));

    if (platform === 'web') {
        if (url && !pointsAtEmulator) return url;
        return `http://${pageHost || 'localhost'}:${API_PORT}`;
    }

    if (url && !(pointsAtEmulator && isDevice)) return url;
    if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') return `http://${metroHost}:${API_PORT}`;
    return platform === 'android' ? `http://${EMULATOR_ALIAS}:${API_PORT}` : `http://localhost:${API_PORT}`;
}

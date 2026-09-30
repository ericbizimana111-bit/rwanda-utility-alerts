import { resolveApiUrl } from './baseUrl';

describe('resolveApiUrl', () => {
    it('uses the page host on web when .env points at the Android emulator', () => {
        expect(resolveApiUrl({ platform: 'web', configured: 'http://10.0.2.2:3000', pageHost: 'localhost' })).toBe('http://localhost:3000');
        expect(resolveApiUrl({ platform: 'web', configured: 'http://10.0.2.2:3000', pageHost: '10.12.73.126' })).toBe('http://10.12.73.126:3000');
    });

    it('keeps an explicit, reachable URL', () => {
        expect(resolveApiUrl({ platform: 'web', configured: 'https://api.example.rw/', pageHost: 'localhost' })).toBe('https://api.example.rw');
        expect(resolveApiUrl({ platform: 'android', configured: 'http://192.168.1.5:3000', isDevice: true })).toBe('http://192.168.1.5:3000');
    });

    it('keeps 10.0.2.2 on the emulator', () => {
        expect(resolveApiUrl({ platform: 'android', configured: 'http://10.0.2.2:3000', isDevice: false, metroHost: '10.0.2.2' })).toBe('http://10.0.2.2:3000');
    });

    it('uses the Metro host PC on a real phone instead of the emulator alias', () => {
        expect(resolveApiUrl({ platform: 'android', configured: 'http://10.0.2.2:3000', isDevice: true, metroHost: '10.12.73.126' })).toBe('http://10.12.73.126:3000');
        expect(resolveApiUrl({ platform: 'ios', isDevice: true, metroHost: '10.12.73.126' })).toBe('http://10.12.73.126:3000');
    });

    it('falls back sensibly without any configuration', () => {
        expect(resolveApiUrl({ platform: 'android' })).toBe('http://10.0.2.2:3000');
        expect(resolveApiUrl({ platform: 'ios' })).toBe('http://localhost:3000');
    });
});

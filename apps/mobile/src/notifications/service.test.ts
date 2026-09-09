import { registerForPushNotifications } from './service';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from '../api/client';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
    PermissionStatus: { GRANTED: 'granted' },
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
    setNotificationChannelAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
}));
jest.mock('../api/client', () => ({ api: { registerDevice: jest.fn() } }));

describe('registerForPushNotifications', () => {
    beforeEach(() => jest.clearAllMocks());

    it('requests permission, gets a token, and registers the authenticated device', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);
        jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExpoPushToken[test]' } as any);

        await expect(registerForPushNotifications()).resolves.toBe('ExpoPushToken[test]');
        expect(api.registerDevice).toHaveBeenCalledWith('ExpoPushToken[test]', expect.any(String));
    });

    it('does not block when permission is denied', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);
        jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);

        await expect(registerForPushNotifications()).resolves.toBeNull();
        expect(api.registerDevice).not.toHaveBeenCalled();
    });

    it('handles token acquisition failures safely', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockRejectedValue(new Error('unavailable'));

        await expect(registerForPushNotifications()).resolves.toBeNull();
    });
});

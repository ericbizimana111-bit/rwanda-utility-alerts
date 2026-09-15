import { registerForPushNotifications, ensurePushRegistration } from './service';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from '../api/client';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
    PermissionStatus: { GRANTED: 'granted' },
    AndroidImportance: { HIGH: 5 },
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
    setNotificationChannelAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
}));
jest.mock('../api/client', () => ({
    api: {
        registerDevice: jest.fn(),
        getStoredDeviceToken: jest.fn(),
        getStoredDeviceId: jest.fn(),
    },
}));

const mockedApi = jest.mocked(api);

describe('ensurePushRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.getStoredDeviceToken.mockResolvedValue(null);
        mockedApi.getStoredDeviceId.mockResolvedValue(null);
    });

    it('requests permission, gets a token, and registers the authenticated device', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExpoPushToken[test]' } as any);
        mockedApi.registerDevice.mockResolvedValue({ deviceId: 'device-1', pushToken: 'ExpoPushToken[test]' });

        await expect(ensurePushRegistration()).resolves.toBe('registered');
        expect(api.registerDevice).toHaveBeenCalledWith('ExpoPushToken[test]', expect.any(String));
    });

    it('does not block when permission is denied', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);
        jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);

        await expect(ensurePushRegistration()).resolves.toBe('permission-denied');
        expect(api.registerDevice).not.toHaveBeenCalled();
    });

    it('handles token acquisition failures safely', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockRejectedValue(new Error('unavailable'));

        await expect(ensurePushRegistration()).resolves.toBe('no-token');
    });

    it('skips re-registering an already stored token', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExpoPushToken[test]' } as any);
        mockedApi.getStoredDeviceToken.mockResolvedValue('ExpoPushToken[test]');

        await expect(ensurePushRegistration()).resolves.toBe('registered');
        expect(api.registerDevice).not.toHaveBeenCalled();
    });

    it('reports rejection when the backend refuses the registration', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExpoPushToken[test]' } as any);
        mockedApi.registerDevice.mockRejectedValue(new Error('rejected'));

        await expect(ensurePushRegistration()).resolves.toBe('rejected');
    });
});

describe('registerForPushNotifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.getStoredDeviceToken.mockResolvedValue(null);
    });

    it('returns the stored token after a successful registration', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
        jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'ExpoPushToken[test]' } as any);
        mockedApi.registerDevice.mockResolvedValue({ deviceId: 'device-1', pushToken: 'ExpoPushToken[test]' });
        // First read (dedupe check) sees no stored token; the final read
        // returns the token that was persisted by registerDevice.
        mockedApi.getStoredDeviceToken
            .mockResolvedValueOnce(null)
            .mockResolvedValue('ExpoPushToken[test]');

        await expect(registerForPushNotifications()).resolves.toBe('ExpoPushToken[test]');
        expect(api.registerDevice).toHaveBeenCalledWith('ExpoPushToken[test]', expect.any(String));
    });

    it('returns null when registration is not possible', async () => {
        jest.mocked(Device, 'isDevice' as never);
        (Device as unknown as { isDevice: boolean }).isDevice = false;

        await expect(registerForPushNotifications()).resolves.toBeNull();
    });
});

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { parseOutageNotificationData } from './payload';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export type PushRegistrationOutcome =
    | 'registered'
    | 'not-device'
    | 'permission-denied'
    | 'no-token'
    | 'rejected';

export async function ensurePushRegistration(): Promise<PushRegistrationOutcome> {
    if (!Device.isDevice) return 'not-device';

    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('outages', {
                name: 'Outage alerts',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
            });
        } catch {
            // Channel creation failing should not block token registration.
        }
    }

    try {
        const current = await Notifications.getPermissionsAsync();
        let status = current.status;
        if (status !== Notifications.PermissionStatus.GRANTED) {
            const requested = await Notifications.requestPermissionsAsync();
            status = requested.status;
        }
        if (status !== Notifications.PermissionStatus.GRANTED) return 'permission-denied';

        const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
        const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (!/^(Expo(nent)?PushToken)\[[^\]]+\]$/.test(token.data)) return 'no-token';

        // Skip the API call when the exact same token is already registered.
        const storedToken = await api.getStoredDeviceToken();
        if (storedToken === token.data) {
            return 'registered';
        }

        try {
            await api.registerDevice(token.data, Platform.OS === 'ios' ? 'ios' : 'android');
            return 'registered';
        } catch {
            return 'rejected';
        }
    } catch {
        return 'no-token';
    }
}

export async function registerForPushNotifications(): Promise<string | null> {
    const outcome = await ensurePushRegistration();
    if (outcome === 'registered') {
        return api.getStoredDeviceToken();
    }
    return null;
}

export function subscribeToPushTokenChanges(onToken: (token: string) => void) {
    return Notifications.addPushTokenListener((event) => {
        if (/^(Expo(nent)?PushToken)\[[^\]]+\]$/.test(event.data)) onToken(event.data);
    });
}

export function registerPushToken(token: string) {
    return api.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
}

export function parseNotificationResponse(response: Notifications.NotificationResponse) {
    return parseOutageNotificationData(response.notification.request.content.data);
}

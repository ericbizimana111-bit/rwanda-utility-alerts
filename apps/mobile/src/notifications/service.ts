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

export async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) return null;
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('outages', {
            name: 'Outage alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== Notifications.PermissionStatus.GRANTED) {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
    }
    if (status !== Notifications.PermissionStatus.GRANTED) return null;

    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    try {
        const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (!/^(Expo(nent)?PushToken)\[[^\]]+\]$/.test(token.data)) return null;
        await api.registerDevice(token.data, Platform.OS === 'ios' ? 'ios' : 'android');
        return token.data;
    } catch {
        return null;
    }
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

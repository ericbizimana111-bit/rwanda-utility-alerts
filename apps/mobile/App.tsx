import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './src/auth/store';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OutageDetailsScreen } from './src/screens/OutageDetailsScreen';
import { OutagesScreen } from './src/screens/OutagesScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { ReportCreateScreen } from './src/screens/ReportCreateScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { parseNotificationResponse } from './src/notifications/service';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    const restore = useAuthStore((state) => state.restore);
    const responseSubscription = useRef<Notifications.EventSubscription | null>(null);
    const receivedSubscription = useRef<Notifications.EventSubscription | null>(null);
    const pendingOutageId = useRef<string | null>(null);

    function openNotification(response: Notifications.NotificationResponse) {
        const payload = parseNotificationResponse(response);
        if (!payload) return;
        pendingOutageId.current = payload.outageId;
        if (user && navigationRef.isReady()) {
            const outageId = pendingOutageId.current;
            pendingOutageId.current = null;
            navigationRef.navigate('OutageDetails', { outageId });
        }
    }

    useEffect(() => {
        if (user && pendingOutageId.current && navigationRef.isReady()) {
            const outageId = pendingOutageId.current;
            pendingOutageId.current = null;
            navigationRef.navigate('OutageDetails', { outageId });
        }
    }, [user]);

    useEffect(() => {
        void restore();
        responseSubscription.current = Notifications.addNotificationResponseReceivedListener(openNotification);
        receivedSubscription.current = Notifications.addNotificationReceivedListener(() => undefined);
        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) openNotification(response);
        }).catch(() => undefined);
        return () => {
            responseSubscription.current?.remove();
            receivedSubscription.current?.remove();
        };
    }, [restore]);

    if (loading) return null;

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator>
                {user ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="OutageDetails" component={OutageDetailsScreen} options={{ title: 'Outage details' }} />
                        <Stack.Screen name="Outages" component={OutagesScreen} />
                        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
                        <Stack.Screen name="ReportCreate" component={ReportCreateScreen} />
                        <Stack.Screen name="Reports" component={ReportsScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

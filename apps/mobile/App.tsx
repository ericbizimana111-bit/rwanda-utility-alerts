import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, LinkingOptions, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from './src/auth/store';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OutagesScreen } from './src/screens/OutagesScreen';
import { OutageDetailsScreen } from './src/screens/OutageDetailsScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { AddSubscriptionScreen } from './src/screens/AddSubscriptionScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DeviceRegistrationScreen } from './src/screens/DeviceRegistrationScreen';
import { TabBar } from './src/components/TabBar';
import { LogoEmblem } from './src/components/LogoEmblem';
import { GradientBackground } from './src/components/GradientBackground';
import { parseNotificationResponse } from './src/notifications/service';
import { MainTabParamList, RootStackParamList } from './src/navigation/types';
import { colors, gradients } from './src/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Deep links, e.g. rwanda-utility-alerts://outage/<id> (paths also work on web).
const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['rwanda-utility-alerts://'],
    config: {
        screens: {
            Main: {
                screens: {
                    Home: '',
                    Outages: 'outages',
                    Subscriptions: 'areas',
                    Reports: 'report',
                    Profile: 'profile',
                },
            },
            OutageDetails: 'outage/:outageId',
            AddSubscription: 'areas/add',
            Notifications: 'alerts',
            DeviceRegistration: 'device',
            Welcome: 'welcome',
            Login: 'login',
            SignUp: 'signup',
        },
    },
};

const navigationTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

function MainTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Outages" component={OutagesScreen} />
            <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function SplashScreen() {
    return (
        <GradientBackground colors={gradients.hero} decorated style={styles.splash}>
            <View style={styles.splashLogo}>
                <LogoEmblem size={84} />
            </View>
        </GradientBackground>
    );
}

export default function App() {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    const restore = useAuthStore((state) => state.restore);
    const responseSubscription = useRef<Notifications.EventSubscription | null>(null);
    const pendingOutageId = useRef<string | null>(null);

    function openPendingOutage() {
        if (!pendingOutageId.current || !navigationRef.isReady()) return;
        const outageId = pendingOutageId.current;
        pendingOutageId.current = null;
        navigationRef.navigate('OutageDetails', { outageId });
    }

    function openNotification(response: Notifications.NotificationResponse) {
        const payload = parseNotificationResponse(response);
        if (!payload) return;
        pendingOutageId.current = payload.outageId;
        if (useAuthStore.getState().user) openPendingOutage();
    }

    useEffect(() => {
        if (user) openPendingOutage();
    }, [user]);

    useEffect(() => {
        void restore();
        responseSubscription.current = Notifications.addNotificationResponseReceivedListener(openNotification);
        Notifications.getLastNotificationResponseAsync()
            .then((response) => {
                if (response) openNotification(response);
            })
            .catch(() => undefined);
        return () => {
            responseSubscription.current?.remove();
        };
    }, [restore]);

    if (loading) return <SplashScreen />;

    return (
        <SafeAreaProvider>
            <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking} onReady={() => user && openPendingOutage()}>
                <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                    {user ? (
                        <>
                            <Stack.Screen name="Main" component={MainTabs} />
                            <Stack.Screen name="OutageDetails" component={OutageDetailsScreen} />
                            <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
                            <Stack.Screen name="Notifications" component={NotificationsScreen} />
                            <Stack.Screen name="DeviceRegistration" component={DeviceRegistrationScreen} />
                        </>
                    ) : (
                        <>
                            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="SignUp" component={SignUpScreen} />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashLogo: {
        padding: 18,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
});

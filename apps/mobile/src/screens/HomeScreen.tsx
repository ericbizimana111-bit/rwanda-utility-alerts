import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../auth/store';
import { registerForPushNotifications, registerPushToken, subscribeToPushTokenChanges } from '../notifications/service';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
    const user = useAuthStore((state) => state.user);
    const signOut = useAuthStore((state) => state.signOut);

    useEffect(() => {
        void registerForPushNotifications();
        const tokenSubscription = subscribeToPushTokenChanges((token) => {
            void registerPushToken(token);
        });
        return () => tokenSubscription.remove();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Hello, {user?.firstName || 'there'}</Text>
                <Text style={styles.subtitle}>Your outage alerts will appear here when they are available.</Text>
                <View style={styles.menu}>
                    <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Outages')}>
                        <Text style={styles.menuLabel}>Outages</Text>
                        <Text style={styles.menuDesc}>Upcoming and active outages</Text>
                    </Pressable>
                    <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Subscriptions')}>
                        <Text style={styles.menuLabel}>Subscriptions</Text>
                        <Text style={styles.menuDesc}>Manage location alerts</Text>
                    </Pressable>
                    <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Reports')}>
                        <Text style={styles.menuLabel}>Reports</Text>
                        <Text style={styles.menuDesc}>Community reports</Text>
                    </Pressable>
                    <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
                        <Text style={styles.menuLabel}>Notifications</Text>
                        <Text style={styles.menuDesc}>Alerts from the backend</Text>
                    </Pressable>
                </View>
                <Pressable style={styles.signOut} onPress={() => void signOut()}>
                    <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    content: { flex: 1, padding: 24, gap: 16 },
    title: { fontSize: 26, fontWeight: '700', color: '#123047' },
    subtitle: { color: '#526674', lineHeight: 22 },
    menu: { gap: 10 },
    menuItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    menuLabel: { fontSize: 17, fontWeight: '700', color: '#123047' },
    menuDesc: { color: '#526674', marginTop: 2, lineHeight: 20 },
    signOut: { marginTop: 8, alignItems: 'center' },
    signOutText: { color: '#b42318', fontWeight: '600' },
});

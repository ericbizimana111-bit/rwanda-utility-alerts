import React, { useEffect } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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
                <Button title="Sign out" onPress={() => void signOut()} />
                <Button title="Open an outage" onPress={() => navigation.navigate('OutageDetails', { outageId: '' })} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    content: { flex: 1, padding: 24, gap: 16 },
    title: { fontSize: 26, fontWeight: '700', color: '#123047' },
    subtitle: { color: '#526674', lineHeight: 22 },
});

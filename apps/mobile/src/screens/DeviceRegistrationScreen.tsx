import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { RootScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon, IconName } from '../components/Icon';
import { Button, Card, InfoNote } from '../components/ui';
import { api, errorMessage } from '../api/client';
import { useAuthStore } from '../auth/store';
import { ensurePushRegistration, PushRegistrationOutcome } from '../notifications/service';

const OUTCOMES: Record<Exclude<PushRegistrationOutcome, 'registered'>, { title: string; message: string; icon: IconName; settings?: boolean }> = {
    'not-device': {
        title: 'Physical phone required',
        message: 'Push notifications only work on a real phone, not on an emulator or simulator.',
        icon: 'device',
    },
    'permission-denied': {
        title: 'Notifications are turned off',
        message: 'Allow notifications for Rwanda Utility Alerts in your phone settings, then try again.',
        icon: 'bell-off',
        settings: true,
    },
    'no-token': {
        title: 'Could not set up push notifications',
        message: 'The push notification service could not be reached. Check your internet connection and try again.',
        icon: 'alert',
    },
    rejected: {
        title: 'Registration was not accepted',
        message: 'The server did not accept this device. Sign out and back in, then try again.',
        icon: 'alert',
    },
};

/** Shows only the start and end of long identifiers. */
function mask(value: string | null): string {
    if (!value) return 'Unknown';
    return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

export function DeviceRegistrationScreen({ navigation }: RootScreenProps<'DeviceRegistration'>) {
    const [status, setStatus] = useState<'loading' | 'registered' | 'error'>('loading');
    const [outcome, setOutcome] = useState<Exclude<PushRegistrationOutcome, 'registered'> | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);
    const notificationsEnabled = useAuthStore((state) => state.user?.notificationsEnabled !== false);

    async function register() {
        setStatus('loading');
        setOutcome(null);
        setErrorText(null);
        try {
            const result = await ensurePushRegistration();
            if (result === 'registered') {
                const [storedId, storedToken] = await Promise.all([api.getStoredDeviceId(), api.getStoredDeviceToken()]);
                if (storedId) {
                    setDeviceId(storedId);
                    setPushToken(storedToken);
                    setStatus('registered');
                    useAuthStore.setState({ pushStatus: 'registered' });
                    return;
                }
                setErrorText('The device was registered but its ID was not saved. Please try again.');
                setStatus('error');
                return;
            }
            setOutcome(result);
            setStatus('error');
        } catch (err) {
            setErrorText(errorMessage(err, 'Device registration failed unexpectedly.'));
            setStatus('error');
        }
    }

    useEffect(() => {
        void register();
    }, []);

    const failure = outcome ? OUTCOMES[outcome] : null;

    return (
        <View style={styles.screen}>
            <AppHeader title="Push notifications" subtitle="This device" showBack onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content}>
                {status === 'loading' ? (
                    <Card style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.title}>Setting up notifications…</Text>
                        <Text style={styles.body}>Registering this phone to receive outage alerts.</Text>
                    </Card>
                ) : status === 'registered' ? (
                    <>
                        <Card style={styles.center}>
                            <View style={[styles.statusIcon, { backgroundColor: colors.successBg }]}>
                                <Icon name="check-circle" size={34} color={colors.success} />
                            </View>
                            <Text style={styles.title}>This phone will receive alerts</Text>
                            <Text style={styles.body}>
                                You'll get a notification as soon as an interruption is announced for an area you follow.
                            </Text>
                        </Card>
                        {!notificationsEnabled ? (
                            <InfoNote tone="warning" icon="bell-off">
                                Outage alerts are paused for your account. Turn them back on in Profile → Outage alerts.
                            </InfoNote>
                        ) : null}
                        <Card style={styles.details}>
                            <Detail label="Device ID" value={mask(deviceId)} />
                            <Detail label="Push token" value={mask(pushToken)} />
                        </Card>
                        <Button title="Register again" icon="refresh" variant="secondary" onPress={() => void register()} />
                    </>
                ) : (
                    <>
                        <Card style={styles.center}>
                            <View style={[styles.statusIcon, { backgroundColor: colors.dangerBg }]}>
                                <Icon name={failure?.icon ?? 'alert'} size={32} color={colors.danger} />
                            </View>
                            <Text style={styles.title}>{failure?.title ?? 'Registration failed'}</Text>
                            <Text style={styles.body}>{failure?.message ?? errorText}</Text>
                        </Card>
                        {failure?.settings ? (
                            <Button title="Open phone settings" icon="external" variant="secondary" onPress={() => void Linking.openSettings()} />
                        ) : null}
                        <Button title="Try again" icon="refresh" onPress={() => void register()} />
                        <InfoNote>You can still see all outages and alerts inside the app without push notifications.</InfoNote>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 16,
        gap: 14,
    },
    center: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 28,
    },
    statusIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    body: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    details: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 13,
        color: colors.textPrimary,
        fontFamily: 'monospace',
    },
});

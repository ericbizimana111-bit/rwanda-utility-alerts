import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { ErrorState } from '../components/ErrorState';
import { api, ApiError } from '../api/client';
import {
    ensurePushRegistration,
    PushRegistrationOutcome,
} from '../notifications/service';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceRegistration'>;

const OUTCOME_MESSAGES: Record<PushRegistrationOutcome, string> = {
    registered: 'Your device is registered for push notifications.',
    'not-device':
        'Push registration requires a physical device. Emulators cannot receive Expo push notifications.',
    'permission-denied':
        'Notification permission was not granted. Enable notifications for this app in system settings and try again.',
    'no-token':
        'Could not obtain a push token from Expo services. Check your connection and try again.',
    rejected:
        'The server rejected the device registration. Make sure you are signed in and try again.',
};

export function DeviceRegistrationScreen({ navigation }: Props) {
    const [status, setStatus] = useState<'loading' | 'registered' | 'error'>('loading');
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function runRegistration() {
        setStatus('loading');
        setErrorMessage(null);
        try {
            const outcome = await ensurePushRegistration();
            if (outcome === 'registered') {
                const [storedId, storedToken] = await Promise.all([
                    api.getStoredDeviceId(),
                    api.getStoredDeviceToken(),
                ]);
                if (storedId) {
                    setDeviceId(storedId);
                    setPushToken(storedToken);
                    setStatus('registered');
                    return;
                }
                // Token registered with Expo but no stored device ID: treat as
                // an error so the user sees the real state, not a fake success.
                setErrorMessage('Registration succeeded but no device ID was stored. Please retry.');
                setStatus('error');
                return;
            }
            setErrorMessage(OUTCOME_MESSAGES[outcome]);
            setStatus('error');
        } catch (err) {
            setErrorMessage(
                err instanceof ApiError ? err.message : 'Device registration failed unexpectedly.'
            );
            setStatus('error');
        }
    }

    useEffect(() => {
        void runRegistration();
    }, []);

    if (status === 'loading') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader
                    title="Device Registration"
                    showBack
                    onBack={() => navigation.goBack()}
                />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Registering your device for push alerts...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (status === 'error') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader
                    title="Device Registration"
                    showBack
                    onBack={() => navigation.goBack()}
                />
                <ErrorState
                    title="Registration failed"
                    description={errorMessage ?? 'An unknown error occurred.'}
                    buttonTitle="Try Again"
                    onRetry={() => void runRegistration()}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Device Registration"
                showBack
                onBack={() => navigation.goBack()}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Checkmark Circle */}
                <View style={styles.checkCircle}>
                    <Icon name="check" size={36} color="#FFFFFF" />
                </View>

                {/* Status Text */}
                <Text style={styles.title}>Device Registered!</Text>
                <Text style={styles.subtitle}>
                    {errorMessage ?? 'Your device has been successfully registered for push notifications.'}
                </Text>

                {/* Device ID Card (real ID returned by POST /devices) */}
                <View style={styles.deviceCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.deviceLabel}>Device ID</Text>
                    </View>
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{deviceId ?? 'Unknown'}</Text>
                    </View>
                </View>

                {/* Push Token Card (real Expo push token) */}
                {pushToken ? (
                    <View style={styles.deviceCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.deviceLabel}>Push Token</Text>
                        </View>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText}>{pushToken}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Register Another Device / Retry */}
                <Pressable
                    style={({ pressed }) => [styles.detailsBtn, pressed && styles.btnPressed]}
                    onPress={() => void runRegistration()}
                >
                    <Text style={styles.detailsBtnText}>Re-register Device</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.headerBg,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
    },
    centered: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 24,
    },
    loadingText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    checkCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: colors.activeGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: colors.activeGreen,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    deviceCard: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    deviceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    codeBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.borderDark,
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    detailsBtn: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderDark,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    btnPressed: {
        backgroundColor: '#F1F5F9',
    },
    detailsBtnText: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
});

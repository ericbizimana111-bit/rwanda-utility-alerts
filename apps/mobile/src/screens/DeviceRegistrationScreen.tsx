import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceRegistration'>;

export function DeviceRegistrationScreen({ navigation }: Props) {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('rwanda-utility-alerts.device-id').then(setDeviceId);
    }, []);

    function copyDeviceId() {
        if (!deviceId) return;
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Alert.alert('Device ID Copied', deviceId);
    }

    function viewDetails() {
        Alert.alert(
            'Device Registration Details',
            `Platform: ${Platform.OS}\nToken Status: Active\nRegistered for: REG & WASAC Outages\nID: ${deviceId || 'Not registered yet'}`
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Device Registration"
                showBack
                onBack={() => navigation.goBack()}
            />

            <View style={styles.container}>
                {/* Checkmark Circle */}
                <View style={styles.checkCircle}>
                    <Icon name="check" size={36} color="#FFFFFF" />
                </View>

                {/* Status Text */}
                <Text style={styles.title}>Device Registered!</Text>
                <Text style={styles.subtitle}>
                    Your device has been successfully registered for push notifications.
                </Text>

                {/* Device ID Card */}
                <View style={styles.deviceCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.deviceLabel}>Device ID</Text>
                        <Pressable onPress={copyDeviceId} hitSlop={10} style={styles.copyBtn}>
                            <Icon name="copy" size={14} color={colors.primary} />
                            <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
                        </Pressable>
                    </View>
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{deviceId || 'Loading...'}</Text>
                    </View>
                </View>

                {/* View Details Button */}
                <Pressable
                    style={({ pressed }) => [styles.detailsBtn, pressed && styles.btnPressed]}
                    onPress={viewDetails}
                >
                    <Text style={styles.detailsBtnText}>View Details</Text>
                </Pressable>
            </View>
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
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
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
        marginBottom: 24,
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
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
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

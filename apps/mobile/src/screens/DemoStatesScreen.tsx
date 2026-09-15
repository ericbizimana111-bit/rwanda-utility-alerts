import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PushNotificationBanner } from '../components/PushNotificationBanner';

type Props = NativeStackScreenProps<RootStackParamList, 'DemoStates'>;

export function DemoStatesScreen({ navigation, route }: Props) {
    const initialMode = route.params?.mode || 'all';
    const [mode, setMode] = useState<'all' | 'push' | 'loading' | 'empty' | 'error'>(initialMode);
    const [showBanner, setShowBanner] = useState(true);

    if (mode === 'loading') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title="Outages" showBack onBack={() => setMode('all')} />
                <LoadingState message="Loading outages..." />
            </SafeAreaView>
        );
    }

    if (mode === 'empty') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title="My Reports" showBack onBack={() => setMode('all')} />
                <EmptyState
                    title="No reports yet"
                    description="Your submitted reports will appear here."
                    buttonTitle="Create a Report"
                    onButtonPress={() => navigation.navigate('Reports')}
                />
            </SafeAreaView>
        );
    }

    if (mode === 'error') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title="Outages" showBack onBack={() => setMode('all')} />
                <ErrorState
                    title="Unable to load data"
                    description="Please check your internet connection and try again."
                    buttonTitle="Retry"
                    onRetry={() => setMode('all')}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader title="UI States & Push Preview" showBack onBack={() => navigation.goBack()} />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Push Notification (Screen 11) */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Screen 11: Push Notification (example)</Text>
                    {showBanner ? (
                        <PushNotificationBanner
                            title="New Outage Alert"
                            subtitle="Kigali City - Electricity"
                            body="Scheduled outage on Sep 9, 2026 at 10:00 AM."
                            timeAgo="now"
                            onPress={() => navigation.navigate('OutageDetails', { outageId: 'outage-kigali-1' })}
                        />
                    ) : (
                        <Pressable style={styles.triggerBtn} onPress={() => setShowBanner(true)}>
                            <Text style={styles.triggerBtnText}>Show Push Notification</Text>
                        </Pressable>
                    )}
                </View>

                {/* State Screen Previews */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Screen 13 - 15: State Screens</Text>
                    <View style={styles.buttonList}>
                        <Pressable style={styles.stateBtn} onPress={() => setMode('loading')}>
                            <Text style={styles.stateBtnTitle}>Screen 13: Loading State</Text>
                            <Text style={styles.stateBtnDesc}>Dotted circular spinner with "Loading outages..."</Text>
                        </Pressable>

                        <Pressable style={styles.stateBtn} onPress={() => setMode('empty')}>
                            <Text style={styles.stateBtnTitle}>Screen 14: Empty State</Text>
                            <Text style={styles.stateBtnDesc}>Document outline icon with "No reports yet"</Text>
                        </Pressable>

                        <Pressable style={styles.stateBtn} onPress={() => setMode('error')}>
                            <Text style={styles.stateBtnTitle}>Screen 15: Error State</Text>
                            <Text style={styles.stateBtnDesc}>Red warning triangle with "Unable to load data"</Text>
                        </Pressable>
                    </View>
                </View>
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
        padding: 20,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    triggerBtn: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    triggerBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    buttonList: {
        gap: 12,
    },
    stateBtn: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    stateBtnTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    stateBtnDesc: {
        fontSize: 13,
        color: colors.textSecondary,
    },
});

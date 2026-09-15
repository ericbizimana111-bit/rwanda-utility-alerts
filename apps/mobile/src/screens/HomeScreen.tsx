import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { OutageCard } from '../components/OutageCard';
import { Icon, IconName } from '../components/Icon';
import { api, Outage, Subscription, NotificationItem } from '../api/client';
import { useAuthStore } from '../auth/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface QuickAction {
    id: string;
    title: string;
    subtitle: string;
    icon: IconName;
    iconColor: string;
    iconBg: string;
    action: () => void;
}

export function HomeScreen({ navigation }: Props) {
    const user = useAuthStore((state) => state.user);
    const [upcomingOutages, setUpcomingOutages] = useState<Outage[]>([]);
    const [activeOutages, setActiveOutages] = useState<Outage[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<NotificationItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadCustomerData = useCallback(async () => {
        try {
            const [upcoming, active, subs, notifs] = await Promise.allSettled([
                api.getUpcomingOutages(),
                api.getActiveOutages(),
                api.getSubscriptions(),
                api.getNotificationList(),
            ]);

            if (upcoming.status === 'fulfilled') setUpcomingOutages(upcoming.value);
            if (active.status === 'fulfilled') setActiveOutages(active.value);
            if (subs.status === 'fulfilled') setSubscriptions(subs.value);
            if (notifs.status === 'fulfilled') setRecentAlerts(notifs.value.slice(0, 2));
        } catch {
            // Keep current state
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            void loadCustomerData();
        });
        void loadCustomerData();
        return unsubscribe;
    }, [navigation, loadCustomerData]);

    async function onRefresh() {
        setRefreshing(true);
        await loadCustomerData();
        setRefreshing(false);
    }

    const quickActions: QuickAction[] = [
        {
            id: 'outages',
            title: 'Outages',
            subtitle: 'Upcoming & active',
            icon: 'lightning',
            iconColor: colors.electricityIcon,
            iconBg: colors.electricityBg,
            action: () => navigation.navigate('Outages'),
        },
        {
            id: 'subs',
            title: 'Subscriptions',
            subtitle: 'My alert locations',
            icon: 'subscriptions',
            iconColor: colors.primary,
            iconBg: colors.alertBlueBg,
            action: () => navigation.navigate('Subscriptions'),
        },
        {
            id: 'report',
            title: 'Report Issue',
            subtitle: 'Submit outage report',
            icon: 'document',
            iconColor: colors.alertYellow,
            iconBg: colors.alertYellowBg,
            action: () => navigation.navigate('Reports'),
        },
        {
            id: 'alerts',
            title: 'Alerts',
            subtitle: 'Latest notices',
            icon: 'bell',
            iconColor: colors.alertPurple,
            iconBg: colors.alertPurpleBg,
            action: () => navigation.navigate('Notifications'),
        },
    ];

    const customerName = user?.firstName || 'Resident';

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                showBrand
                showActions
                avatarLetter={(user?.firstName || 'Resident').charAt(0).toUpperCase()}
                onBellPress={() => navigation.navigate('Notifications')}
                onProfilePress={() => navigation.navigate('Profile')}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Customer Greeting Card */}
                <View style={styles.greetingCard}>
                    <View style={styles.waterIconCircle}>
                        <Icon name="water" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.greetingTextCol}>
                        <Text style={styles.greetingSub}>Hello,</Text>
                        <Text style={styles.greetingName}>{customerName}</Text>
                        <Text style={styles.greetingDesc}>
                            Stay informed about utility updates affecting your home and community.
                        </Text>
                    </View>
                </View>

                {/* Subscribed Areas Outage Status Summary */}
                <View style={styles.statusRow}>
                    {/* Active Outages in Area */}
                    <Pressable
                        style={({ pressed }) => [styles.statusCard, pressed && styles.cardPressed]}
                        onPress={() => navigation.navigate('Outages')}
                    >
                        <View style={styles.statusTopRow}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: activeOutages.length > 0 ? colors.alertRed : colors.activeGreen },
                                ]}
                            />
                            <Text style={styles.statusCardLabel}>Active Outages</Text>
                        </View>
                        <Text style={styles.statusCount}>{activeOutages.length}</Text>
                        <Text style={styles.statusSubtext}>
                            {activeOutages.length > 0 ? 'Outages currently active' : 'All services operational'}
                        </Text>
                    </Pressable>

                    {/* Upcoming Outages in Area */}
                    <Pressable
                        style={({ pressed }) => [styles.statusCard, pressed && styles.cardPressed]}
                        onPress={() => navigation.navigate('Outages')}
                    >
                        <View style={styles.statusTopRow}>
                            <View style={[styles.statusDot, { backgroundColor: colors.electricityIcon }]} />
                            <Text style={styles.statusCardLabel}>Upcoming Outages</Text>
                        </View>
                        <Text style={styles.statusCount}>{upcomingOutages.length}</Text>
                        <Text style={styles.statusSubtext}>Scheduled in utility grid</Text>
                    </Pressable>
                </View>

                {/* My Subscriptions Summary */}
                <View style={styles.subscriptionsCard}>
                    <View style={styles.subsHeader}>
                        <View style={styles.subsTitleRow}>
                            <Icon name="subscriptions" size={18} color={colors.primary} />
                            <Text style={styles.subsTitle}>My Subscribed Locations</Text>
                        </View>
                        <Pressable onPress={() => navigation.navigate('Subscriptions')} hitSlop={8}>
                            <Text style={styles.manageLink}>Manage</Text>
                        </Pressable>
                    </View>

                    {subscriptions.length > 0 ? (
                        <View style={styles.subsChipsContainer}>
                            {subscriptions.slice(0, 3).map((sub) => (
                                <View key={sub.id} style={styles.subChip}>
                                    <Icon
                                        name={sub.utility?.name?.toLowerCase().includes('water') ? 'water' : 'lightning'}
                                        size={14}
                                        color={sub.utility?.name?.toLowerCase().includes('water') ? colors.water : colors.electricityIcon}
                                    />
                                    <Text style={styles.subChipText}>
                                        {sub.location?.district || 'District'} · {sub.utility?.name || 'Utility'}
                                    </Text>
                                </View>
                            ))}
                            {subscriptions.length > 3 ? (
                                <Text style={styles.moreSubsText}>+{subscriptions.length - 3} more</Text>
                            ) : null}
                        </View>
                    ) : (
                        <View style={styles.noSubsRow}>
                            <Text style={styles.noSubsText}>No subscribed locations yet.</Text>
                            <Pressable onPress={() => navigation.navigate('AddSubscription')}>
                                <Text style={styles.addSubLink}>+ Add Location</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                    <Text style={styles.sectionHeading}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((qa) => (
                            <Pressable
                                key={qa.id}
                                style={({ pressed }) => [styles.quickActionTile, pressed && styles.cardPressed]}
                                onPress={qa.action}
                            >
                                <View style={[styles.qaIconCircle, { backgroundColor: qa.iconBg }]}>
                                    <Icon name={qa.icon} size={20} color={qa.iconColor} />
                                </View>
                                <Text style={styles.qaTitle}>{qa.title}</Text>
                                <Text style={styles.qaSubtitle}>{qa.subtitle}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Upcoming Outages List */}
                <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeading}>Upcoming Outages</Text>
                        <Pressable onPress={() => navigation.navigate('Outages')} hitSlop={8}>
                            <Text style={styles.viewAllText}>View all</Text>
                        </Pressable>
                    </View>

                    {upcomingOutages.length > 0 ? (
                        upcomingOutages.slice(0, 3).map((outage) => (
                            <OutageCard
                                key={outage.id}
                                outage={outage}
                                onPress={() => navigation.navigate('OutageDetails', { outageId: outage.id })}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>No upcoming outages scheduled.</Text>
                        </View>
                    )}
                </View>

                {/* Recent Alerts Section */}
                {recentAlerts.length > 0 ? (
                    <View style={styles.recentSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeading}>Recent Alerts</Text>
                            <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8}>
                                <Text style={styles.viewAllText}>View all</Text>
                            </Pressable>
                        </View>

                        {recentAlerts.map((alert) => (
                            <Pressable
                                key={alert.id}
                                style={styles.alertPreviewCard}
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <View style={styles.alertPreviewLeft}>
                                    <View style={styles.alertDot} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.alertPreviewTitle}>{alert.title}</Text>
                                        <Text style={styles.alertPreviewMsg}>{alert.message}</Text>
                                    </View>
                                </View>
                                <Text style={styles.alertPreviewTime}>{alert.createdAt}</Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
            </ScrollView>

            <BottomNavigation
                activeTab="Home"
                onTabPress={(tab) => {
                    if (tab === 'Outages') navigation.navigate('Outages');
                    else if (tab === 'Subscriptions') navigation.navigate('Subscriptions');
                    else if (tab === 'Reports') navigation.navigate('Reports');
                    else if (tab === 'More') navigation.navigate('Profile');
                }}
            />
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
        padding: 16,
        paddingBottom: 28,
        gap: 16,
    },
    greetingCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    waterIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.alertBlueBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    greetingTextCol: {
        flex: 1,
        gap: 2,
    },
    greetingSub: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    greetingName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    greetingDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
        lineHeight: 16,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statusCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
        gap: 4,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.99 }],
    },
    statusTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    statusCount: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 2,
    },
    statusSubtext: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    subscriptionsCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    subsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    manageLink: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    subsChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    subChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: colors.borderDark,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    subChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    moreSubsText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },
    noSubsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    noSubsText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    addSubLink: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    quickActionsSection: {
        gap: 10,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    quickActionTile: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    qaIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    qaTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    qaSubtitle: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    recentSection: {
        gap: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyCardText: {
        fontSize: 13,
        color: colors.textMuted,
    },
    alertPreviewCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    alertPreviewLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    alertDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    alertPreviewTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    alertPreviewMsg: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    alertPreviewTime: {
        fontSize: 11,
        color: colors.textMuted,
        paddingLeft: 8,
    },
});

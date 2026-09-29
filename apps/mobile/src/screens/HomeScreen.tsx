import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { TabScreenProps } from '../navigation/types';
import { colors, radius, shadows } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { OutageCard } from '../components/OutageCard';
import { Icon, IconName } from '../components/Icon';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Card, SectionHeader } from '../components/ui';
import { api, Outage } from '../api/client';
import { useAuthStore } from '../auth/store';
import { useLoader } from '../hooks/useLoader';
import { formatDay, formatRelativeTime, kinyarwandaGreeting } from '../utils/format';
import { affectedAreasByDistrict, outageCountdown, outagePhase, outagesForSubscriptions } from '../utils/outage';

async function loadHome() {
    const [upcoming, active, subscriptions, notifications] = await Promise.all([
        api.getUpcomingOutages(),
        api.getActiveOutages(),
        api.getSubscriptions(),
        api.getNotificationList(),
    ]);
    return { upcoming, active, subscriptions, notifications };
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
    const user = useAuthStore((state) => state.user);
    const { data, error, loading, refreshing, refresh, retry } = useLoader(loadHome, 'Unable to load the latest outages.');

    const firstName = user?.firstName || 'there';
    const now = new Date();

    const summary = useMemo(() => {
        if (!data) return null;
        const current = [...data.active, ...data.upcoming].filter((outage) => outagePhase(outage) !== 'ended');
        const mine = outagesForSubscriptions(current, data.subscriptions);
        const mineIds = new Set(mine.map((outage) => outage.id));
        const myActive = mine.filter((outage) => outagePhase(outage) === 'active');
        const myUpcoming = mine.filter((outage) => outagePhase(outage) === 'upcoming');
        return {
            mine,
            mineIds,
            myActive,
            myUpcoming,
            elsewhere: data.upcoming.filter((outage) => !mineIds.has(outage.id)).slice(0, 3),
            unread: data.notifications.filter((item) => !item.isRead).length,
            recentAlerts: data.notifications.slice(0, 2),
        };
    }, [data]);

    const header = (
        <AppHeader
            showBrand
            showActions
            avatarLetter={firstName.charAt(0).toUpperCase()}
            unreadBadge={summary?.unread ?? 0}
            onBellPress={() => navigation.navigate('Notifications')}
            onProfilePress={() => navigation.navigate('Profile')}
        >
            <Text style={styles.greeting}>{kinyarwandaGreeting(now)}, {firstName}</Text>
            <Text style={styles.date}>{formatDay(now)} · Kigali time</Text>
        </AppHeader>
    );

    if (loading) {
        return (
            <View style={styles.screen}>
                {header}
                <LoadingState rows={3} />
            </View>
        );
    }

    if (error || !data || !summary) {
        return (
            <View style={styles.screen}>
                {header}
                <ErrorState title="Couldn't load outages" description={error ?? undefined} onRetry={() => void retry()} />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {header}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />}
                showsVerticalScrollIndicator={false}
            >
                <AreaStatusCard
                    followed={data.subscriptions.length}
                    active={summary.myActive}
                    upcoming={summary.myUpcoming}
                    onAddArea={() => navigation.navigate('AddSubscription')}
                    onOpenOutage={(id) => navigation.navigate('OutageDetails', { outageId: id })}
                    onManage={() => navigation.navigate('Subscriptions')}
                />

                <View style={styles.stats}>
                    <StatTile
                        icon="activity"
                        color={colors.danger}
                        bg={colors.dangerBg}
                        value={data.active.length}
                        label="In progress"
                        caption="nationwide"
                        onPress={() => navigation.navigate('Outages', { phase: 'active' })}
                    />
                    <StatTile
                        icon="calendar"
                        color={colors.warning}
                        bg={colors.warningBg}
                        value={data.upcoming.length}
                        label="Scheduled"
                        caption="nationwide"
                        onPress={() => navigation.navigate('Outages', { phase: 'upcoming' })}
                    />
                    <StatTile
                        icon="map-pin"
                        color={colors.primary}
                        bg={colors.primaryLight}
                        value={data.subscriptions.length}
                        label="My areas"
                        caption="followed"
                        onPress={() => navigation.navigate('Subscriptions')}
                    />
                </View>

                {summary.mine.length > 0 ? (
                    <View>
                        <SectionHeader title="Affecting your areas" subtitle="Current and scheduled interruptions" />
                        {summary.mine.slice(0, 4).map((outage) => (
                            <OutageCard
                                key={outage.id}
                                outage={outage}
                                affectsYou
                                onPress={() => navigation.navigate('OutageDetails', { outageId: outage.id })}
                            />
                        ))}
                    </View>
                ) : null}

                <View>
                    <SectionHeader
                        title="Coming up across Rwanda"
                        subtitle="Planned interruptions from REG and WASAC"
                        actionLabel="See all"
                        onAction={() => navigation.navigate('Outages', { phase: 'upcoming' })}
                    />
                    {summary.elsewhere.length > 0 ? (
                        summary.elsewhere.map((outage) => (
                            <OutageCard key={outage.id} outage={outage} onPress={() => navigation.navigate('OutageDetails', { outageId: outage.id })} />
                        ))
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Icon name="check-circle" size={20} color={colors.success} />
                            <Text style={styles.emptyText}>No other planned interruptions have been announced.</Text>
                        </Card>
                    )}
                </View>

                {summary.recentAlerts.length > 0 ? (
                    <View>
                        <SectionHeader title="Recent alerts" actionLabel="All alerts" onAction={() => navigation.navigate('Notifications')} />
                        <Card style={styles.alertsCard}>
                            {summary.recentAlerts.map((alert, index) => (
                                <Pressable
                                    key={alert.id}
                                    onPress={() => navigation.navigate('OutageDetails', { outageId: alert.outageId })}
                                    style={({ pressed }) => [styles.alertRow, index > 0 && styles.alertDivider, pressed && styles.pressed]}
                                >
                                    <View style={[styles.alertDot, alert.isRead && styles.alertDotRead]} />
                                    <View style={styles.alertBody}>
                                        <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
                                        <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                                    </View>
                                    <Text style={styles.alertTime}>{formatRelativeTime(alert.createdAt) ?? ''}</Text>
                                </Pressable>
                            ))}
                        </Card>
                    </View>
                ) : null}

                <Card onPress={() => navigation.navigate('Reports', { tab: 'submit' })} style={styles.reportBanner}>
                    <View style={styles.reportIcon}>
                        <Icon name="message" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.reportText}>
                        <Text style={styles.reportTitle}>No power or water right now?</Text>
                        <Text style={styles.reportBody}>Report an unannounced interruption in your area.</Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </Card>

                <Text style={styles.sourceNote}>
                    Outage information comes from official announcements by REG (electricity) and WASAC (water). Times are shown in Kigali time.
                </Text>
            </ScrollView>
        </View>
    );
}

function AreaStatusCard({
    followed,
    active,
    upcoming,
    onAddArea,
    onOpenOutage,
    onManage,
}: {
    followed: number;
    active: Outage[];
    upcoming: Outage[];
    onAddArea: () => void;
    onOpenOutage: (id: string) => void;
    onManage: () => void;
}) {
    if (followed === 0) {
        return (
            <Card onPress={onAddArea} style={[styles.statusCard, { borderColor: colors.primarySoft }]}>
                <View style={[styles.statusIcon, { backgroundColor: colors.primaryLight }]}>
                    <Icon name="map-pin" size={24} color={colors.primary} />
                </View>
                <View style={styles.statusBody}>
                    <Text style={styles.statusEyebrow}>Get started</Text>
                    <Text style={styles.statusTitle}>Follow your home area</Text>
                    <Text style={styles.statusText}>Choose your district or sector to get alerts before interruptions begin.</Text>
                </View>
                <Icon name="plus" size={20} color={colors.primary} />
            </Card>
        );
    }

    const lead = active[0] ?? upcoming[0];
    if (lead) {
        const isActive = Boolean(active[0]);
        const tone = isActive ? { fg: colors.danger, bg: colors.dangerBg, border: '#F8C9C9' } : { fg: colors.warning, bg: colors.warningBg, border: '#FCD9A0' };
        const areas = affectedAreasByDistrict(lead)
            .map(({ district, areas: names }) => (names.length ? `${names.slice(0, 2).join(', ')} (${district})` : district))
            .join(' · ');
        const others = active.length + upcoming.length - 1;
        return (
            <Card onPress={() => onOpenOutage(lead.id)} style={[styles.statusCard, { borderColor: tone.border }]}>
                <View style={[styles.statusIcon, { backgroundColor: tone.bg }]}>
                    <Icon name={isActive ? 'power-off' : 'calendar'} size={24} color={tone.fg} />
                </View>
                <View style={styles.statusBody}>
                    <Text style={[styles.statusEyebrow, { color: tone.fg }]}>{isActive ? 'Interruption in progress' : 'Planned interruption'}</Text>
                    <Text style={styles.statusTitle} numberOfLines={2}>{lead.title}</Text>
                    {areas ? <Text style={styles.statusText} numberOfLines={2}>{areas}</Text> : null}
                    <Text style={[styles.statusMeta, { color: tone.fg }]}>{outageCountdown(lead) ?? ''}</Text>
                    {others > 0 ? <Text style={styles.statusMore}>+{others} more affecting your areas</Text> : null}
                </View>
                <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </Card>
        );
    }

    return (
        <Card onPress={onManage} style={[styles.statusCard, { borderColor: '#BFE6CC' }]}>
            <View style={[styles.statusIcon, { backgroundColor: colors.successBg }]}>
                <Icon name="check-circle" size={24} color={colors.success} />
            </View>
            <View style={styles.statusBody}>
                <Text style={[styles.statusEyebrow, { color: colors.success }]}>All clear</Text>
                <Text style={styles.statusTitle}>No interruptions announced</Text>
                <Text style={styles.statusText}>
                    Nothing current or scheduled for the {followed} area{followed === 1 ? '' : 's'} you follow.
                </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </Card>
    );
}

function StatTile({
    icon,
    color,
    bg,
    value,
    label,
    caption,
    onPress,
}: {
    icon: IconName;
    color: string;
    bg: string;
    value: number;
    label: string;
    caption: string;
    onPress: () => void;
}) {
    return (
        <Card onPress={onPress} style={styles.stat} accessibilityLabel={`${value} ${label} ${caption}`}>
            <View style={[styles.statIcon, { backgroundColor: bg }]}>
                <Icon name={icon} size={16} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statCaption}>{caption}</Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    date: {
        fontSize: 13,
        color: colors.textOnDarkMuted,
        marginTop: 4,
    },
    content: {
        padding: 16,
        paddingBottom: 32,
        gap: 22,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1.5,
        ...shadows.raised,
    },
    statusIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBody: {
        flex: 1,
        gap: 3,
    },
    statusEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.primary,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    statusText: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    statusMeta: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    statusMore: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '600',
    },
    stats: {
        flexDirection: 'row',
        gap: 10,
    },
    stat: {
        flex: 1,
        padding: 14,
        gap: 2,
    },
    statIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    statCaption: {
        fontSize: 11,
        color: colors.textMuted,
    },
    emptyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    alertsCard: {
        padding: 0,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
    },
    alertDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    pressed: {
        backgroundColor: colors.surfaceSubtle,
    },
    alertDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.unreadDot,
        marginTop: 6,
    },
    alertDotRead: {
        backgroundColor: colors.borderDark,
    },
    alertBody: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    alertMessage: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
        lineHeight: 17,
    },
    alertTime: {
        fontSize: 11,
        color: colors.textMuted,
    },
    reportBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.primaryLight,
        borderColor: colors.primarySoft,
    },
    reportIcon: {
        width: 42,
        height: 42,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportText: {
        flex: 1,
    },
    reportTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.primaryDark,
    },
    reportBody: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    sourceNote: {
        fontSize: 11,
        lineHeight: 16,
        color: colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: 12,
    },
});

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, RefreshControl } from 'react-native';
import { RootScreenProps } from '../navigation/types';
import { colors, gradients, radius } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon, IconName } from '../components/Icon';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { GradientBackground } from '../components/GradientBackground';
import { Button, Card, InfoNote, StatusPill } from '../components/ui';
import { api } from '../api/client';
import { useLoader } from '../hooks/useLoader';
import { formatClock, formatDay, isAllDay } from '../utils/format';
import {
    affectedAreasByDistrict,
    outageAffectsSubscription,
    outageCountdown,
    outageDuration,
    outagePhase,
    PHASE_STYLE,
    UTILITY_THEME,
    utilityKind,
} from '../utils/outage';
import { SUPPORT_CONTACTS } from '../constants/contacts';

export function OutageDetailsScreen({ route, navigation }: RootScreenProps<'OutageDetails'>) {
    const { outageId } = route.params;
    const load = useCallback(async () => {
        const [outage, subscriptions] = await Promise.all([
            api.getOutage(outageId),
            api.getSubscriptions().catch(() => []),
        ]);
        return { outage, subscriptions };
    }, [outageId]);
    const { data, error, loading, refreshing, refresh, retry } = useLoader(load, 'This outage could not be loaded. It may have been removed.');

    const header = <AppHeader title="Outage details" showBack onBack={() => navigation.goBack()} />;

    if (loading) {
        return (
            <View style={styles.screen}>
                {header}
                <LoadingState rows={3} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.screen}>
                {header}
                <ErrorState title="Outage unavailable" description={error ?? undefined} onRetry={() => void retry()} />
            </View>
        );
    }

    const { outage, subscriptions } = data;
    const kind = utilityKind(outage.utility);
    const utility = UTILITY_THEME[kind];
    const phase = outagePhase(outage);
    const phaseStyle = PHASE_STYLE[phase];
    const countdown = outageCountdown(outage);
    const duration = outageDuration(outage);
    const groups = affectedAreasByDistrict(outage);
    const affectsYou = subscriptions.some((subscription) => outageAffectsSubscription(outage, subscription));
    const start = outage.startTime ? new Date(outage.startTime) : null;
    const end = outage.endTime ? new Date(outage.endTime) : null;
    const allDay = isAllDay(outage.startTime, outage.endTime);
    const contact = SUPPORT_CONTACTS.find((item) => item.id === (kind === 'water' ? 'wasac' : 'reg'));

    return (
        <View style={styles.screen}>
            {header}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />}
            >
                <GradientBackground colors={kind === 'water' ? gradients.water : gradients.electricity} decorated style={styles.hero}>
                    <View style={styles.heroTop}>
                        <View style={styles.heroIcon}>
                            <Icon name={utility.icon} size={26} color="#FFFFFF" />
                        </View>
                        <View style={styles.heroPill}>
                            <View style={[styles.heroDot, { backgroundColor: phaseStyle.color }]} />
                            <Text style={styles.heroPillText}>{phaseStyle.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.heroEyebrow}>{utility.label} interruption</Text>
                    <Text style={styles.heroTitle}>{outage.title}</Text>
                    {countdown ? (
                        <View style={styles.heroCountdown}>
                            <Icon name="clock" size={14} color="#FFFFFF" />
                            <Text style={styles.heroCountdownText}>{countdown}</Text>
                        </View>
                    ) : null}
                </GradientBackground>

                {affectsYou ? (
                    <InfoNote tone="warning" icon="map-pin">This interruption reaches one of the areas you follow.</InfoNote>
                ) : null}

                <Card style={styles.section}>
                    <SectionTitle icon="calendar" title="When" />
                    {start ? (
                        <View style={styles.scheduleGrid}>
                            <ScheduleItem label="Date" value={formatDay(start)} />
                            {allDay ? (
                                <ScheduleItem label="Hours" value="All day (hours not specified)" />
                            ) : (
                                <>
                                    <ScheduleItem label="Starts" value={formatClock(start)} />
                                    <ScheduleItem
                                        label="Expected back"
                                        value={end ? `${formatClock(end)}${formatDay(end) !== formatDay(start) ? `, ${formatDay(end)}` : ''}` : 'Not announced'}
                                    />
                                    {duration ? <ScheduleItem label="Duration" value={duration} /> : null}
                                </>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.body}>The schedule has not been announced yet.</Text>
                    )}
                    <Text style={styles.timezone}>All times are Kigali time (CAT, UTC+2).</Text>
                </Card>

                <Card style={styles.section}>
                    <SectionTitle icon="map-pin" title="Affected areas" />
                    {groups.length ? (
                        groups.map(({ district, areas }) => (
                            <View key={district} style={styles.district}>
                                <Text style={styles.districtName}>{district} District</Text>
                                {areas.length ? (
                                    <View style={styles.areaChips}>
                                        {areas.map((area) => (
                                            <View key={area} style={styles.areaChip}>
                                                <Text style={styles.areaChipText}>{area}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={styles.body}>See the announcement below for the exact neighbourhoods.</Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.body}>No affected locations were listed for this outage.</Text>
                    )}
                </Card>

                {outage.description ? (
                    <Card style={styles.section}>
                        <SectionTitle icon="document" title="Announcement" />
                        <Text style={styles.body}>{outage.description}</Text>
                    </Card>
                ) : null}

                <Card style={styles.section}>
                    <SectionTitle icon="shield" title="Source" />
                    <View style={styles.sourceRow}>
                        <StatusPill
                            label={outage.sourceType === 'official' ? 'Official announcement' : 'Reported'}
                            color={outage.sourceType === 'official' ? colors.success : colors.warning}
                            bg={outage.sourceType === 'official' ? colors.successBg : colors.warningBg}
                        />
                    </View>
                    <Text style={styles.sourceName}>{outage.sourceName || 'Source not specified'}</Text>
                    {outage.sourceUrl ? (
                        <Button
                            title="Open official announcement"
                            icon="external"
                            variant="secondary"
                            size="md"
                            onPress={() => void Linking.openURL(outage.sourceUrl as string)}
                        />
                    ) : null}
                </Card>

                {contact?.phone ? (
                    <Button
                        title={`Call ${contact.name} · ${contact.phone}`}
                        icon="phone"
                        variant="ghost"
                        onPress={() => void Linking.openURL(`tel:${contact.phone}`)}
                    />
                ) : null}

                <Text style={styles.footnote}>
                    Schedules can change at short notice. Always confirm with the official announcement from {utility.provider}.
                </Text>
            </ScrollView>
        </View>
    );
}

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
    return (
        <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
                <Icon name={icon} size={15} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function ScheduleItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>{label}</Text>
            <Text style={styles.scheduleValue}>{value}</Text>
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
        paddingBottom: 36,
        gap: 14,
    },
    hero: {
        borderRadius: radius.xl,
        padding: 20,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    heroDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    heroPillText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    heroEyebrow: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.85)',
    },
    heroTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
        lineHeight: 27,
    },
    heroCountdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.16)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    heroCountdownText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    section: {
        gap: 12,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionIcon: {
        width: 28,
        height: 28,
        borderRadius: 9,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    scheduleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    scheduleItem: {
        flexGrow: 1,
        minWidth: '45%',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    scheduleLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.textMuted,
    },
    scheduleValue: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 3,
    },
    timezone: {
        fontSize: 12,
        color: colors.textMuted,
    },
    district: {
        gap: 8,
    },
    districtName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    areaChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    areaChip: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    areaChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primaryDark,
    },
    body: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 21,
    },
    sourceRow: {
        flexDirection: 'row',
    },
    sourceName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    footnote: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 17,
        paddingHorizontal: 8,
    },
});

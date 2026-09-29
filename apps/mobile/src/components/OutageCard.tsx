import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { Card, StatusPill, UtilityIcon } from './ui';
import { Outage } from '../api/client';
import { formatTimeRange } from '../utils/format';
import { areaSummary, outageCountdown, outagePhase, PHASE_STYLE, UTILITY_THEME, utilityKind } from '../utils/outage';

interface OutageCardProps {
    outage: Outage;
    onPress: () => void;
    /** Highlights outages that reach one of the user's followed areas. */
    affectsYou?: boolean;
}

export function OutageCard({ outage, onPress, affectsYou = false }: OutageCardProps) {
    const kind = utilityKind(outage.utility);
    const phase = outagePhase(outage);
    const phaseStyle = PHASE_STYLE[phase];
    const timeDisplay = formatTimeRange(outage.startTime, outage.endTime) ?? 'Time to be announced';
    const areas = areaSummary(outage);
    const countdown = outageCountdown(outage);

    return (
        <Card
            onPress={onPress}
            style={[styles.card, affectsYou && styles.cardAffects]}
            accessibilityLabel={`${outage.title}. ${phaseStyle.label}. ${timeDisplay}`}
        >
            <View style={[styles.accent, { backgroundColor: UTILITY_THEME[kind].iconColor }]} />
            <View style={styles.row}>
                <UtilityIcon kind={kind} size={44} />
                <View style={styles.body}>
                    <View style={styles.topRow}>
                        <Text style={styles.provider}>{UTILITY_THEME[kind].label} · {outage.sourceName ?? UTILITY_THEME[kind].provider}</Text>
                        <StatusPill label={phaseStyle.label} color={phaseStyle.color} bg={phaseStyle.bg} />
                    </View>
                    <Text style={styles.title} numberOfLines={2}>{outage.title}</Text>

                    <View style={styles.metaRow}>
                        <Icon name="calendar" size={13} color={colors.textSecondary} />
                        <Text style={styles.meta} numberOfLines={1}>{timeDisplay}</Text>
                    </View>
                    {areas ? (
                        <View style={styles.metaRow}>
                            <Icon name="map-pin" size={13} color={colors.textSecondary} />
                            <Text style={styles.meta} numberOfLines={1}>{areas}</Text>
                        </View>
                    ) : null}

                    {countdown || affectsYou ? (
                        <View style={styles.footer}>
                            {countdown ? (
                                <View style={styles.countdown}>
                                    <Icon name="clock" size={12} color={phaseStyle.color} />
                                    <Text style={[styles.countdownText, { color: phaseStyle.color }]}>{countdown}</Text>
                                </View>
                            ) : <View />}
                            {affectsYou ? (
                                <View style={styles.affects}>
                                    <Icon name="map-pin" size={11} color={colors.primary} />
                                    <Text style={styles.affectsText}>Your area</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        paddingLeft: 18,
        overflow: 'hidden',
    },
    cardAffects: {
        borderColor: colors.primarySoft,
    },
    accent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 14,
    },
    body: {
        flex: 1,
        gap: 5,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    provider: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    meta: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    countdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    countdownText: {
        fontSize: 12,
        fontWeight: '700',
    },
    affects: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    affectsText: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.primary,
    },
});

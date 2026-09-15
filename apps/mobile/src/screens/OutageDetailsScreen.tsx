import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { api, Outage, extractOutageAreas } from '../api/client';
import { formatTimeRange } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'OutageDetails'>;

function statusLabel(status: string | undefined): string {
    if (!status) return 'Outage';
    switch (status.toLowerCase()) {
        case 'planned':
        case 'scheduled':
            return 'Scheduled Outage';
        case 'active':
        case 'ongoing':
            return 'Active Outage';
        case 'resolved':
        case 'completed':
            return 'Resolved';
        case 'cancelled':
            return 'Cancelled';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

export function OutageDetailsScreen({ route, navigation }: Props) {
    const { outageId } = route.params;
    const [outage, setOutage] = useState<Outage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchDetail() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getOutage(outageId);
            setOutage(data);
        } catch {
            setError('Unable to load this outage. It may no longer exist.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [outageId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title="Outage Details" showBack onBack={() => navigation.goBack()} />
                <LoadingState message="Loading outage details..." />
            </SafeAreaView>
        );
    }

    if (error || !outage) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title="Outage Details" showBack onBack={() => navigation.goBack()} />
                <ErrorState
                    title="Unable to load outage"
                    description={error ?? 'This outage could not be found.'}
                    buttonTitle="Retry"
                    onRetry={() => void fetchDetail()}
                />
            </SafeAreaView>
        );
    }

    const isWater = outage.utility?.name?.toLowerCase().includes('water');
    const iconColor = isWater ? colors.water : colors.electricityIcon;
    const iconBg = isWater ? colors.waterBg : colors.electricityBg;
    const iconName = isWater ? 'water' : 'lightning';

    // Real affected locations from the outage record (may be empty).
    const affectedAreas = extractOutageAreas(outage);

    const timeDisplay = formatTimeRange(outage.startTime, outage.endTime);

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Outage Details"
                showBack
                onBack={() => navigation.goBack()}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Outage Header Box */}
                <View style={styles.headerBox}>
                    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                        <Icon name={iconName} size={28} color={iconColor} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.outageTitle}>{outage.title}</Text>
                        <Text style={styles.outageStatus}>{statusLabel(outage.status)}</Text>
                        {timeDisplay ? (
                            <Text style={styles.outageTime}>{timeDisplay}</Text>
                        ) : (
                            <Text style={styles.outageTime}>Schedule to be announced</Text>
                        )}
                    </View>
                </View>

                {/* Section: Description */}
                {outage.description ? (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeadingRow}>
                            <Icon name="info" size={18} color={colors.textPrimary} />
                            <Text style={styles.sectionHeading}>Details</Text>
                        </View>
                        <Text style={styles.sectionBody}>{outage.description}</Text>
                    </View>
                ) : null}

                {/* Section: Affected Areas */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                        <Icon name="users" size={18} color={colors.textPrimary} />
                        <Text style={styles.sectionHeading}>Affected Areas</Text>
                    </View>
                    {affectedAreas.length > 0 ? (
                        <View style={styles.bulletList}>
                            {affectedAreas.map((area) => (
                                <View key={area} style={styles.bulletItem}>
                                    <View style={styles.bulletDot} />
                                    <Text style={styles.bulletText}>{area}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.sectionBody}>
                            No specific affected locations were provided for this outage.
                        </Text>
                    )}
                </View>

                {/* Section: Utility */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                        <Icon name="lightning" size={18} color={colors.textPrimary} />
                        <Text style={styles.sectionHeading}>Utility</Text>
                    </View>
                    <Text style={styles.sectionValue}>{outage.utility?.name ?? 'Unknown utility'}</Text>
                </View>

                {/* Section: Source */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                        <Icon name="bell" size={18} color={colors.textPrimary} />
                        <Text style={styles.sectionHeading}>Source</Text>
                    </View>
                    <Text style={styles.sectionValue}>
                        {outage.sourceName || 'Not specified'}
                    </Text>
                    {outage.sourceUrl ? (
                        <Text style={styles.sectionSubValue}>{outage.sourceUrl}</Text>
                    ) : null}
                </View>

                {/* Info Callout Banner */}
                <View style={styles.infoCallout}>
                    <View style={styles.infoIconWrapper}>
                        <Icon name="info" size={18} color={colors.infoText} />
                    </View>
                    <Text style={styles.infoText}>
                        This information is provided by the official utility provider. Times are subject
                        to change.
                    </Text>
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
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    headerBox: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        flex: 1,
        gap: 3,
    },
    outageTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    outageStatus: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    outageTime: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 2,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    sectionHeadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    sectionValue: {
        fontSize: 14,
        color: colors.textSecondary,
        paddingLeft: 26,
    },
    sectionSubValue: {
        fontSize: 12,
        color: colors.textMuted,
        paddingLeft: 26,
    },
    sectionBody: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        paddingLeft: 26,
    },
    bulletList: {
        paddingLeft: 26,
        gap: 6,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bulletDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.textSecondary,
    },
    bulletText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    infoCallout: {
        backgroundColor: colors.infoBg,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.infoBorder,
        marginTop: 4,
    },
    infoIconWrapper: {
        paddingTop: 1,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.infoText,
        lineHeight: 18,
    },
});

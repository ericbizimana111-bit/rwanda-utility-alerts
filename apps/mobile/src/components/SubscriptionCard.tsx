import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { Card, StatusPill, UtilityIcon } from './ui';
import { Subscription } from '../api/client';
import { UTILITY_THEME, utilityKind } from '../utils/outage';

interface SubscriptionCardProps {
    subscription: Subscription;
    onRemove?: () => void;
    /** Number of current or upcoming outages reaching this area. */
    outageCount?: number;
}

export function SubscriptionCard({ subscription, onRemove, outageCount = 0 }: SubscriptionCardProps) {
    const kind = utilityKind(subscription.utility);
    const location = subscription.location;
    const place = location?.sector ?? location?.district ?? 'Unknown area';
    const detail = location?.sector
        ? `${location.district} District · ${location.province}`
        : `Whole district · ${location?.province ?? ''}`;

    return (
        <Card style={styles.card}>
            <View style={styles.row}>
                <UtilityIcon kind={kind} size={46} />
                <View style={styles.body}>
                    <Text style={styles.place}>{place}</Text>
                    <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
                    <View style={styles.pills}>
                        <StatusPill
                            label={`${UTILITY_THEME[kind].label} alerts`}
                            color={UTILITY_THEME[kind].color}
                            bg={UTILITY_THEME[kind].bg}
                            dot={false}
                        />
                        {outageCount > 0 ? (
                            <StatusPill label={`${outageCount} outage${outageCount === 1 ? '' : 's'}`} color={colors.danger} bg={colors.dangerBg} />
                        ) : (
                            <StatusPill label="All clear" color={colors.success} bg={colors.successBg} />
                        )}
                    </View>
                </View>
                {onRemove ? (
                    <Pressable
                        onPress={onRemove}
                        hitSlop={10}
                        style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Stop following ${place}`}
                    >
                        <Icon name="trash" size={17} color={colors.textSecondary} />
                    </Pressable>
                ) : null}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    body: {
        flex: 1,
        gap: 3,
    },
    place: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    detail: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    pills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    remove: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removePressed: {
        backgroundColor: colors.dangerBg,
    },
});

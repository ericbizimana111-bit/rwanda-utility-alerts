import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon, IconName } from './Icon';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: IconName;
    iconColor: string;
    iconBg: string;
    onPress?: () => void;
}

export function StatCard({
    title,
    value,
    icon,
    iconColor,
    iconBg,
    onPress,
}: StatCardProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.topRow}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    <Icon name={icon} size={18} color={iconColor} />
                </View>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            <Text style={styles.value}>{value}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 88,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    cardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.99 }],
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
        flexShrink: 1,
    },
    value: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 6,
    },
});

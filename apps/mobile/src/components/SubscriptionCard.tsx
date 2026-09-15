import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { Subscription } from '../api/client';

interface SubscriptionCardProps {
    subscription: Subscription;
    onManage?: () => void;
}

export function SubscriptionCard({ subscription, onManage }: SubscriptionCardProps) {
    const isWater = subscription.utility?.name?.toLowerCase().includes('water');
    const iconColor = isWater ? colors.water : colors.electricityIcon;
    const iconBg = isWater ? colors.waterBg : colors.electricityBg;
    const iconName = isWater ? 'water' : 'lightning';

    return (
        <View style={styles.card}>
            <View style={styles.leftCol}>
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                    <Icon name={iconName} size={20} color={iconColor} />
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.title}>
                        {subscription.location?.district || 'District'}
                    </Text>
                    <Text style={styles.utility}>
                        {subscription.utility?.name || 'Utility'}
                    </Text>
                </View>
            </View>

            <View style={styles.rightCol}>
                <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Active</Text>
                </View>
                <Pressable
                    style={({ pressed }) => [styles.manageButton, pressed && styles.managePressed]}
                    onPress={onManage}
                >
                    <Text style={styles.manageText}>Manage</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCol: {
        gap: 3,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    utility: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    rightCol: {
        alignItems: 'flex-end',
        gap: 8,
    },
    activeBadge: {
        backgroundColor: colors.activeGreenBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.activeGreen,
    },
    manageButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    managePressed: {
        backgroundColor: '#F1F5F9',
    },
    manageText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textPrimary,
    },
});

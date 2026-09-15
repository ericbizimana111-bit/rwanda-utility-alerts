import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { Outage } from '../api/client';

interface OutageCardProps {
    outage: Outage;
    onPress: () => void;
}

export function OutageCard({ outage, onPress }: OutageCardProps) {
    const isWater = outage.utility?.name?.toLowerCase().includes('water');
    const iconColor = isWater ? colors.water : colors.electricityIcon;
    const iconBg = isWater ? colors.waterBg : colors.electricityBg;
    const iconName = isWater ? 'water' : 'lightning';

    // Format timing
    const timeDisplay = [outage.startTime, outage.endTime].filter(Boolean).join(' - ');

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onPress}
        >
            <View style={styles.leftCol}>
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                    <Icon name={iconName} size={20} color={iconColor} />
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.title}>{outage.title}</Text>
                    <Text style={styles.status}>{outage.status || 'Scheduled Outage'}</Text>
                    <Text style={styles.time}>{timeDisplay || 'Schedule to be announced'}</Text>
                </View>
            </View>

            <View style={styles.rightCol}>
                <Icon name="chevron-right" size={18} color={colors.textMuted} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
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
    cardPressed: {
        backgroundColor: '#F8FAFC',
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCol: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    status: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    time: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    rightCol: {
        paddingLeft: 8,
    },
});

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon, IconName } from './Icon';
import { NotificationItem } from '../api/client';

interface NotificationCardProps {
    notification: NotificationItem;
    onPress: () => void;
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
    // Determine icon and colors based on title/message content
    let iconName: IconName = 'bell';
    let iconColor = colors.primary;
    let iconBg = colors.alertBlueBg;

    const titleLower = notification.title.toLowerCase();
    const msgLower = notification.message.toLowerCase();

    if (titleLower.includes('new outage alert') && msgLower.includes('rwamagana')) {
        iconName = 'lightning';
        iconColor = colors.alertPurple;
        iconBg = colors.alertPurpleBg;
    } else if (titleLower.includes('new outage alert')) {
        iconName = 'lightning';
        iconColor = colors.alertRed;
        iconBg = colors.alertRedBg;
    } else if (titleLower.includes('outage update')) {
        iconName = 'water';
        iconColor = colors.alertBlue;
        iconBg = colors.alertBlueBg;
    } else if (titleLower.includes('service restored')) {
        iconName = 'check';
        iconColor = colors.alertGreen;
        iconBg = colors.alertGreenBg;
    } else if (titleLower.includes('report')) {
        iconName = 'clock';
        iconColor = colors.alertYellow;
        iconBg = colors.alertYellowBg;
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onPress}
        >
            <View style={styles.leftCol}>
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                    <Icon name={iconName} size={18} color={iconColor} />
                </View>

                <View style={styles.contentCol}>
                    <Text style={styles.title}>{notification.title}</Text>
                    <Text style={styles.message}>{notification.message}</Text>
                    <Text style={styles.time}>{notification.createdAt}</Text>
                </View>
            </View>

            <View style={styles.rightCol}>
                {!notification.isRead && <View style={styles.unreadDot} />}
                <Icon name="chevron-right" size={16} color={colors.textMuted} />
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
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentCol: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    message: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    time: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    rightCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 8,
    },
    unreadDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.unreadDot,
    },
});

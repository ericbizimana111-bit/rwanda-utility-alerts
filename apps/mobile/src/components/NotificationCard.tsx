import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { Card, UtilityIcon } from './ui';
import { NotificationItem } from '../api/client';
import { formatRelativeTime } from '../utils/format';
import { utilityKind } from '../utils/outage';

interface NotificationCardProps {
    notification: NotificationItem;
    onPress: () => void;
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
    // The icon follows the utility of the outage this alert is about.
    const kind = utilityKind(notification.outage?.utility);
    const unread = !notification.isRead;

    return (
        <Card onPress={onPress} style={[styles.card, unread && styles.unreadCard]} accessibilityLabel={`${unread ? 'Unread. ' : ''}${notification.title}`}>
            <View style={styles.row}>
                <UtilityIcon kind={kind} size={42} />
                <View style={styles.body}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={2}>{notification.title}</Text>
                        {unread ? <View style={styles.dot} /> : null}
                    </View>
                    <Text style={styles.message} numberOfLines={3}>{notification.message}</Text>
                    <View style={styles.metaRow}>
                        <Icon name="clock" size={12} color={colors.textMuted} />
                        <Text style={styles.time}>{formatRelativeTime(notification.createdAt) ?? ''}</Text>
                    </View>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    unreadCard: {
        borderColor: colors.primarySoft,
        backgroundColor: '#FBFDFF',
    },
    row: {
        flexDirection: 'row',
        gap: 14,
    },
    body: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    titleUnread: {
        fontWeight: '800',
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: colors.unreadDot,
        marginTop: 5,
    },
    message: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 19,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    time: {
        fontSize: 12,
        color: colors.textMuted,
    },
});

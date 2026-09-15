import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { LogoEmblem } from './LogoEmblem';

interface PushNotificationBannerProps {
    title?: string;
    subtitle?: string;
    body?: string;
    timeAgo?: string;
    onPress?: () => void;
}

export function PushNotificationBanner({
    title = 'New Outage Alert',
    subtitle = 'Kigali City - Electricity',
    body = 'Scheduled outage on Sep 9, 2026 at 10:00 AM.',
    timeAgo = 'now',
    onPress,
}: PushNotificationBannerProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
            onPress={onPress}
        >
            <View style={styles.leftCol}>
                <LogoEmblem size={32} />
            </View>

            <View style={styles.rightCol}>
                <View style={styles.headerRow}>
                    <Text style={styles.appName}>Rwanda Utility Alerts</Text>
                    <Text style={styles.timeAgo}>{timeAgo}</Text>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
                <Text style={styles.body}>{body}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: colors.pushDark,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.pushSubtle,
    },
    bannerPressed: {
        opacity: 0.9,
    },
    leftCol: {
        paddingTop: 2,
    },
    rightCol: {
        flex: 1,
        gap: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    appName: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    timeAgo: {
        fontSize: 11,
        color: '#64748B',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#E2E8F0',
    },
    body: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 16,
        marginTop: 2,
    },
});

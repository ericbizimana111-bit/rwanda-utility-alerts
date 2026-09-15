import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Icon } from './Icon';
import { LogoEmblem } from './LogoEmblem';

interface AppHeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    showBrand?: boolean; // If true, shows logo + "Rwanda Utility Alerts"
    showActions?: boolean; // Bell + Avatar
    avatarLetter?: string;
    onBellPress?: () => void;
    onProfilePress?: () => void;
    rightIcon?: React.ReactNode;
    unreadBadge?: number;
}

export function AppHeader({
    title,
    showBack = false,
    onBack,
    showBrand = false,
    showActions = false,
    avatarLetter,
    onBellPress,
    onProfilePress,
    rightIcon,
    unreadBadge = 0,
}: AppHeaderProps) {
    const insets = useSafeAreaInsets();
    const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 16);

    return (
        <View style={[styles.headerContainer, { paddingTop: topInset + 6 }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
            <View style={styles.headerContent}>
                {/* Left section */}
                <View style={styles.leftSection}>
                    {showBack ? (
                        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
                            <Icon name="back" size={22} color="#FFFFFF" />
                        </Pressable>
                    ) : null}

                    {showBrand ? (
                        <View style={styles.brandRow}>
                            <LogoEmblem size={28} />
                            <Text style={styles.brandTitle}>Rwanda Utility Alerts</Text>
                        </View>
                    ) : (
                        <Text style={[styles.headerTitle, showBack && styles.titleWithBack]}>
                            {title}
                        </Text>
                    )}
                </View>

                {/* Right section */}
                <View style={styles.rightSection}>
                    {rightIcon}
                    {showActions && (
                        <View style={styles.actionsRow}>
                            <Pressable onPress={onBellPress} style={styles.actionBtn} hitSlop={10}>
                                <Icon name="bell" size={20} color="#FFFFFF" />
                                {unreadBadge > 0 ? <View style={styles.bellBadge} /> : null}
                            </Pressable>
                            <Pressable onPress={onProfilePress} style={styles.avatarCircle} hitSlop={6}>
                                <Text style={styles.avatarText}>{avatarLetter || 'U'}</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: colors.headerBg,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 36,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    titleWithBack: {
        fontSize: 18,
        fontWeight: '700',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    actionBtn: {
        padding: 4,
        position: 'relative',
    },
    bellBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.alertRed,
        borderWidth: 1.5,
        borderColor: colors.headerBg,
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});

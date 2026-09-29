import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '../theme/colors';
import { Icon } from './Icon';
import { LogoEmblem } from './LogoEmblem';
import { GradientBackground } from './GradientBackground';
import { FlagStripe } from './FlagStripe';

interface AppHeaderProps {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    showBrand?: boolean; // Logo + "Rwanda Utility Alerts"
    showActions?: boolean; // Bell + avatar
    avatarLetter?: string;
    onBellPress?: () => void;
    onProfilePress?: () => void;
    rightIcon?: React.ReactNode;
    unreadBadge?: number;
    /** Extra content rendered inside the gradient, below the title row. */
    children?: React.ReactNode;
}

export function AppHeader({
    title,
    subtitle,
    showBack = false,
    onBack,
    showBrand = false,
    showActions = false,
    avatarLetter,
    onBellPress,
    onProfilePress,
    rightIcon,
    unreadBadge = 0,
    children,
}: AppHeaderProps) {
    const insets = useSafeAreaInsets();
    const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 12) : 16);

    return (
        <View>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDeep} />
            <GradientBackground colors={gradients.header} decorated style={[styles.container, { paddingTop: topInset + 8 }]}>
                <View style={styles.row}>
                    <View style={styles.left}>
                        {showBack ? (
                            <Pressable
                                onPress={onBack}
                                hitSlop={12}
                                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                                accessibilityRole="button"
                                accessibilityLabel="Go back"
                            >
                                <Icon name="back" size={20} color="#FFFFFF" />
                            </Pressable>
                        ) : null}

                        {showBrand ? (
                            <View style={styles.brandRow}>
                                <LogoEmblem size={30} />
                                <View>
                                    <Text style={styles.brandTitle}>Rwanda Utility Alerts</Text>
                                    <Text style={styles.brandSubtitle}>Electricity · Water</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.titleBlock}>
                                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                                {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
                            </View>
                        )}
                    </View>

                    <View style={styles.right}>
                        {rightIcon}
                        {showActions ? (
                            <>
                                <Pressable
                                    onPress={onBellPress}
                                    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                                    hitSlop={8}
                                    accessibilityRole="button"
                                    accessibilityLabel={unreadBadge > 0 ? `Alerts, ${unreadBadge} unread` : 'Alerts'}
                                >
                                    <Icon name="bell" size={19} color="#FFFFFF" />
                                    {unreadBadge > 0 ? (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{unreadBadge > 9 ? '9+' : unreadBadge}</Text>
                                        </View>
                                    ) : null}
                                </Pressable>
                                <Pressable
                                    onPress={onProfilePress}
                                    style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
                                    hitSlop={6}
                                    accessibilityRole="button"
                                    accessibilityLabel="Profile"
                                >
                                    <Text style={styles.avatarText}>{avatarLetter || 'U'}</Text>
                                </Pressable>
                            </>
                        ) : null}
                    </View>
                </View>
                {children ? <View style={styles.children}>{children}</View> : null}
            </GradientBackground>
            <FlagStripe />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 18,
        paddingBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 40,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.75,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.1,
    },
    brandSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textOnDarkMuted,
        letterSpacing: 0.4,
    },
    titleBlock: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textOnDarkMuted,
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        backgroundColor: colors.flagYellow,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primaryDark,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.primaryDeep,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 15,
    },
    children: {
        marginTop: 16,
    },
});

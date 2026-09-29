import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, shadows } from '../theme/colors';
import { GradientBackground } from './GradientBackground';
import { FlagStripe } from './FlagStripe';
import { LogoEmblem } from './LogoEmblem';
import { Icon } from './Icon';

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    onBack?: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

/** Gradient hero with a floating form card, shared by sign-in and sign-up. */
export function AuthLayout({ title, subtitle, onBack, children, footer }: AuthLayoutProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <GradientBackground colors={gradients.hero} decorated style={[styles.hero, { paddingTop: insets.top + 12 }]}>
                        {onBack ? (
                            <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
                                <Icon name="back" size={20} color="#FFFFFF" />
                            </Pressable>
                        ) : null}
                        <View style={styles.brandRow}>
                            <LogoEmblem size={44} />
                            <Text style={styles.brandText}>Rwanda Utility Alerts</Text>
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </GradientBackground>
                    <FlagStripe />

                    <View style={styles.card}>{children}</View>
                    {footer ? <View style={styles.footer}>{footer}</View> : null}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        flexGrow: 1,
    },
    hero: {
        paddingHorizontal: 24,
        paddingBottom: 64,
    },
    back: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        marginBottom: 22,
    },
    brandText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textOnDarkMuted,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textOnDarkMuted,
        marginTop: 6,
        lineHeight: 21,
    },
    card: {
        marginTop: -44,
        marginHorizontal: 18,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 20,
        gap: 16,
        ...shadows.raised,
    },
    footer: {
        marginTop: 22,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
});

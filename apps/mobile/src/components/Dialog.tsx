import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '../theme/colors';
import { Icon, IconName } from './Icon';

interface DialogProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    icon?: IconName;
    tone?: 'primary' | 'danger' | 'success';
    children?: React.ReactNode;
    /** Buttons row, rendered at the bottom. */
    actions?: React.ReactNode;
    dismissable?: boolean;
}

const TONES = {
    primary: { fg: colors.primary, bg: colors.primaryLight },
    danger: { fg: colors.danger, bg: colors.dangerBg },
    success: { fg: colors.success, bg: colors.successBg },
};

/** Centered modal dialog used for confirmations, forms and information. */
export function Dialog({ visible, onClose, title, message, icon, tone = 'primary', children, actions, dismissable = true }: DialogProps) {
    const palette = TONES[tone];
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissable ? onClose : undefined} statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <Pressable style={styles.overlay} onPress={dismissable ? onClose : undefined}>
                    <Pressable style={styles.card} onPress={() => undefined}>
                        <View style={styles.header}>
                            {icon ? (
                                <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
                                    <Icon name={icon} size={24} color={palette.fg} />
                                </View>
                            ) : null}
                            <View style={styles.headerText}>
                                <Text style={styles.title}>{title}</Text>
                                {message ? <Text style={styles.message}>{message}</Text> : null}
                            </View>
                            {dismissable ? (
                                <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
                                    <Icon name="close" size={18} color={colors.textMuted} />
                                </Pressable>
                            ) : null}
                        </View>
                        {children ? (
                            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" bounces={false}>
                                {children}
                            </ScrollView>
                        ) : null}
                        {actions ? <View style={styles.actions}>{actions}</View> : null}
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        padding: 22,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 20,
        maxHeight: '86%',
        ...shadows.raised,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
        paddingTop: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },
    message: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginTop: 6,
    },
    close: {
        padding: 4,
    },
    body: {
        marginTop: 16,
        flexGrow: 0,
    },
    bodyContent: {
        gap: 14,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
});

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';
import { colors, radius, shadows } from '../theme/colors';
import { Icon, IconName } from './Icon';
import { UTILITY_THEME, UtilityKind } from '../utils/outage';

/* ---------------------------------- Card ---------------------------------- */

export function Card({
    children,
    style,
    onPress,
    accessibilityLabel,
}: {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    accessibilityLabel?: string;
}) {
    if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
        >
            {children}
        </Pressable>
    );
}

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'light' | 'outlineLight';

export function Button({
    title,
    onPress,
    variant = 'primary',
    icon,
    loading = false,
    disabled = false,
    size = 'lg',
    style,
}: {
    title: string;
    onPress?: () => void;
    variant?: ButtonVariant;
    icon?: IconName;
    loading?: boolean;
    disabled?: boolean;
    size?: 'md' | 'lg';
    style?: StyleProp<ViewStyle>;
}) {
    const palette = BUTTON_PALETTE[variant];
    const inactive = disabled || loading;
    return (
        <Pressable
            onPress={onPress}
            disabled={inactive}
            accessibilityRole="button"
            accessibilityState={{ disabled: inactive, busy: loading }}
            style={({ pressed }) => [
                styles.button,
                size === 'md' && styles.buttonMd,
                { backgroundColor: palette.bg, borderColor: palette.border },
                variant === 'primary' && !inactive && shadows.button,
                inactive && styles.buttonDisabled,
                pressed && !inactive && styles.buttonPressed,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={palette.fg} />
            ) : (
                <>
                    {icon ? <Icon name={icon} size={size === 'md' ? 16 : 18} color={palette.fg} /> : null}
                    <Text style={[styles.buttonText, size === 'md' && styles.buttonTextMd, { color: palette.fg }]}>{title}</Text>
                </>
            )}
        </Pressable>
    );
}

const BUTTON_PALETTE: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: '#FFFFFF', border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.primarySoft },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: colors.danger },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: colors.border },
    light: { bg: '#FFFFFF', fg: colors.primaryDark, border: '#FFFFFF' },
    // For use on dark or gradient backgrounds.
    outlineLight: { bg: 'rgba(255,255,255,0.08)', fg: '#FFFFFF', border: 'rgba(255,255,255,0.5)' },
};

/* -------------------------------- TextField ------------------------------- */

export function TextField({
    label,
    icon,
    error,
    hint,
    secure = false,
    style,
    ...inputProps
}: TextInputProps & {
    label: string;
    icon?: IconName;
    error?: string | null;
    hint?: string;
    secure?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);
    const multiline = Boolean(inputProps.multiline);

    return (
        <View style={[styles.field, style]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View
                style={[
                    styles.inputWrap,
                    multiline && styles.inputWrapMultiline,
                    focused && styles.inputFocused,
                    error ? styles.inputError : null,
                ]}
            >
                {icon ? (
                    <View style={[styles.inputIcon, multiline && styles.inputIconTop]}>
                        <Icon name={icon} size={18} color={focused ? colors.primary : colors.textMuted} />
                    </View>
                ) : null}
                <TextInput
                    {...inputProps}
                    style={[styles.input, multiline && styles.inputMultiline]}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secure && hidden}
                    onFocus={(event) => {
                        setFocused(true);
                        inputProps.onFocus?.(event);
                    }}
                    onBlur={(event) => {
                        setFocused(false);
                        inputProps.onBlur?.(event);
                    }}
                    accessibilityLabel={label}
                />
                {secure ? (
                    <Pressable
                        onPress={() => setHidden((value) => !value)}
                        hitSlop={10}
                        style={styles.eye}
                        accessibilityRole="button"
                        accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
                    >
                        <Icon name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
                    </Pressable>
                ) : null}
            </View>
            {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
        </View>
    );
}

/* ---------------------------- SegmentedControl --------------------------- */

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    onDark = false,
    style,
}: {
    options: Array<{ value: T; label: string; count?: number }>;
    value: T;
    onChange: (value: T) => void;
    /** Light-on-dark styling for use inside gradient headers. */
    onDark?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <View style={[styles.segmented, onDark && styles.segmentedDark, style]} accessibilityRole="tablist">
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        style={[styles.segment, active && styles.segmentActive]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                    >
                        <Text style={[styles.segmentText, onDark && !active && styles.segmentTextDark, active && styles.segmentTextActive]} numberOfLines={1}>
                            {option.label}
                        </Text>
                        {option.count !== undefined ? (
                            <View style={[styles.segmentCount, onDark && !active && styles.segmentCountDark, active && styles.segmentCountActive]}>
                                <Text style={[styles.segmentCountText, onDark && !active && styles.segmentTextDark, active && styles.segmentCountTextActive]}>{option.count}</Text>
                            </View>
                        ) : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

/* ---------------------------------- Chips --------------------------------- */

export function Chip({
    label,
    selected = false,
    onPress,
    icon,
    iconColor,
}: {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    icon?: IconName;
    iconColor?: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.chip, selected && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
        >
            {icon ? <Icon name={icon} size={13} color={selected ? '#FFFFFF' : iconColor ?? colors.textSecondary} /> : null}
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
        </Pressable>
    );
}

/* ------------------------------- StatusPill ------------------------------- */

export function StatusPill({ label, color, bg, dot = true }: { label: string; color: string; bg: string; dot?: boolean }) {
    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            {dot ? <View style={[styles.pillDot, { backgroundColor: color }]} /> : null}
            <Text style={[styles.pillText, { color }]}>{label}</Text>
        </View>
    );
}

/* ------------------------------- UtilityIcon ------------------------------ */

export function UtilityIcon({ kind, size = 44 }: { kind: UtilityKind; size?: number }) {
    const theme = UTILITY_THEME[kind];
    return (
        <View style={[styles.utilityIcon, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: theme.bg }]}>
            <Icon name={theme.icon} size={size * 0.46} color={theme.iconColor} />
        </View>
    );
}

/* ------------------------------ SectionHeader ----------------------------- */

export function SectionHeader({
    title,
    subtitle,
    actionLabel,
    onAction,
}: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
            </View>
            {actionLabel && onAction ? (
                <Pressable onPress={onAction} hitSlop={10} style={styles.sectionAction} accessibilityRole="button">
                    <Text style={styles.sectionActionText}>{actionLabel}</Text>
                    <Icon name="chevron-right" size={14} color={colors.primary} />
                </Pressable>
            ) : null}
        </View>
    );
}

/* -------------------------------- InfoNote -------------------------------- */

export function InfoNote({
    children,
    tone = 'info',
    icon = 'info',
}: {
    children: React.ReactNode;
    tone?: 'info' | 'warning' | 'success';
    icon?: IconName;
}) {
    const palette = {
        info: { bg: colors.infoBg, border: colors.infoBorder, fg: colors.info },
        warning: { bg: colors.warningBg, border: '#FCD34D', fg: colors.warning },
        success: { bg: colors.successBg, border: '#A7E3BC', fg: colors.success },
    }[tone];
    return (
        <View style={[styles.note, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <Icon name={icon} size={17} color={palette.fg} />
            <Text style={[styles.noteText, { color: palette.fg }]}>{children}</Text>
        </View>
    );
}

/* --------------------------------- ListRow -------------------------------- */

export function ListRow({
    icon,
    iconColor = colors.primary,
    iconBg = colors.primaryLight,
    title,
    subtitle,
    onPress,
    right,
    last = false,
    destructive = false,
}: {
    icon: IconName;
    iconColor?: string;
    iconBg?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    last?: boolean;
    destructive?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            style={({ pressed }) => [styles.listRow, !last && styles.listRowDivider, pressed && styles.listRowPressed]}
        >
            <View style={[styles.listIcon, { backgroundColor: destructive ? colors.logoutBg : iconBg }]}>
                <Icon name={icon} size={18} color={destructive ? colors.logoutRed : iconColor} />
            </View>
            <View style={styles.listText}>
                <Text style={[styles.listTitle, destructive && { color: colors.logoutRed }]}>{title}</Text>
                {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
            </View>
            {right ?? (onPress ? <Icon name="chevron-right" size={18} color={colors.textMuted} /> : null)}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        ...shadows.card,
    },
    cardPressed: {
        opacity: 0.92,
        transform: [{ scale: 0.99 }],
    },
    button: {
        height: 52,
        borderRadius: radius.md,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 18,
    },
    buttonMd: {
        height: 42,
        borderRadius: 10,
        paddingHorizontal: 14,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonPressed: {
        opacity: 0.88,
        transform: [{ scale: 0.99 }],
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    buttonTextMd: {
        fontSize: 14,
    },
    field: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 14,
        minHeight: 52,
    },
    inputWrapMultiline: {
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    inputFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    inputError: {
        borderColor: colors.danger,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputIconTop: {
        marginTop: 3,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        paddingVertical: 12,
    },
    inputMultiline: {
        minHeight: 110,
        paddingTop: 2,
        textAlignVertical: 'top',
    },
    eye: {
        padding: 6,
    },
    fieldError: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '500',
    },
    fieldHint: {
        fontSize: 12,
        color: colors.textMuted,
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: '#E6ECF3',
        borderRadius: radius.md,
        padding: 4,
    },
    segmentedDark: {
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    segmentTextDark: {
        color: 'rgba(255,255,255,0.88)',
    },
    segmentCountDark: {
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: 9,
    },
    segmentActive: {
        backgroundColor: colors.surface,
        ...shadows.card,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    segmentTextActive: {
        color: colors.primaryDark,
        fontWeight: '800',
    },
    segmentCount: {
        minWidth: 20,
        paddingHorizontal: 6,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(15,27,45,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentCountActive: {
        backgroundColor: colors.primaryLight,
    },
    segmentCountText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    segmentCountTextActive: {
        color: colors.primary,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
    },
    pillDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    utilityIcon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitleBlock: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    sectionAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingBottom: 2,
    },
    sectionActionText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    note: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
    },
    listRowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    listRowPressed: {
        backgroundColor: colors.surfaceSubtle,
    },
    listIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listText: {
        flex: 1,
    },
    listTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    listSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
});

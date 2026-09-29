import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/colors';
import { Icon } from './Icon';
import { UTILITY_THEME, UtilityKind } from '../utils/outage';

export type UtilityChoice = UtilityKind | 'both';

/** Large selectable cards for choosing electricity, water or both. */
export function UtilitySelector({
    value,
    onChange,
    allowBoth = false,
}: {
    value: UtilityChoice | null;
    onChange: (value: UtilityChoice) => void;
    allowBoth?: boolean;
}) {
    const choices: UtilityChoice[] = allowBoth ? ['electricity', 'water', 'both'] : ['electricity', 'water'];

    return (
        <View style={styles.row}>
            {choices.map((choice) => {
                const active = value === choice;
                const theme = choice === 'both' ? null : UTILITY_THEME[choice];
                return (
                    <Pressable
                        key={choice}
                        onPress={() => onChange(choice)}
                        style={[styles.option, active && styles.optionActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                    >
                        <View style={styles.icons}>
                            {choice === 'both' ? (
                                <>
                                    <Icon name="lightning" size={18} color={colors.electricityIcon} />
                                    <Icon name="water" size={18} color={colors.waterIcon} />
                                </>
                            ) : (
                                <Icon name={theme!.icon} size={22} color={theme!.iconColor} />
                            )}
                        </View>
                        <Text style={[styles.label, active && styles.labelActive]}>{choice === 'both' ? 'Both' : theme!.label}</Text>
                        <Text style={styles.provider}>{choice === 'both' ? 'REG + WASAC' : theme!.provider}</Text>
                        {active ? (
                            <View style={styles.check}>
                                <Icon name="check" size={12} color="#FFFFFF" />
                            </View>
                        ) : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    option: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSubtle,
        gap: 4,
    },
    optionActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    icons: {
        flexDirection: 'row',
        gap: 2,
        height: 24,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    labelActive: {
        color: colors.primaryDark,
    },
    provider: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
    },
    check: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

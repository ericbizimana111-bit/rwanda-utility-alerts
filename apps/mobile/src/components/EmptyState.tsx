import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Icon, IconName } from './Icon';
import { Button } from './ui';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: IconName;
    iconColor?: string;
    iconBg?: string;
    buttonTitle?: string;
    onButtonPress?: () => void;
    compact?: boolean;
}

export function EmptyState({
    title,
    description,
    icon = 'check-circle',
    iconColor = colors.primary,
    iconBg = colors.primaryLight,
    buttonTitle,
    onButtonPress,
    compact = false,
}: EmptyStateProps) {
    return (
        <View style={[styles.container, compact && styles.compact]}>
            <View style={[styles.iconCircle, compact && styles.iconCompact, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={compact ? 24 : 34} color={iconColor} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {buttonTitle && onButtonPress ? (
                <Button title={buttonTitle} onPress={onButtonPress} size="md" style={styles.button} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    compact: {
        flex: 0,
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    iconCompact: {
        width: 52,
        height: 52,
        borderRadius: 18,
        marginBottom: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 6,
    },
    button: {
        marginTop: 20,
        alignSelf: 'center',
        minWidth: 180,
    },
});

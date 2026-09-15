import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';

interface ErrorStateProps {
    title?: string;
    description?: string;
    buttonTitle?: string;
    onRetry?: () => void;
}

export function ErrorState({
    title = 'Unable to load data',
    description = 'Please check your internet connection and try again.',
    buttonTitle = 'Retry',
    onRetry,
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Icon name="alert" size={38} color={colors.alertRed} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {buttonTitle && onRetry && (
                <Pressable
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                    onPress={onRetry}
                >
                    <Text style={styles.buttonText}>{buttonTitle}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.alertRedBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.9,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

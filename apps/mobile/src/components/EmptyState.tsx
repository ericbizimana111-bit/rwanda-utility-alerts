import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';

interface EmptyStateProps {
    title?: string;
    description?: string;
    buttonTitle?: string;
    onButtonPress?: () => void;
}

export function EmptyState({
    title = 'No reports yet',
    description = 'Your submitted reports will appear here.',
    buttonTitle = 'Create a Report',
    onButtonPress,
}: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Icon name="document" size={42} color="#94A3B8" />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {buttonTitle && onButtonPress && (
                <Pressable
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                    onPress={onButtonPress}
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
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
        paddingHorizontal: 28,
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

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = 'Loading outages...' }: LoadingStateProps) {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1100,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Svg width={44} height={44} viewBox="0 0 44 44">
                    <Circle
                        cx="22"
                        cy="22"
                        r="18"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                        fill="none"
                    />
                    <Circle
                        cx="22"
                        cy="22"
                        r="18"
                        stroke={colors.primary}
                        strokeWidth="3.5"
                        strokeDasharray="40 80"
                        strokeLinecap="round"
                        fill="none"
                    />
                </Svg>
            </Animated.View>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
    },
    message: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
});

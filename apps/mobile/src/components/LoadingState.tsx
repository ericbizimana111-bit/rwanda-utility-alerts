import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius } from '../theme/colors';

/** Pulsing placeholder block used while content loads. */
function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
    const pulse = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return <Animated.View style={[styles.block, style, { opacity: pulse }]} />;
}

/** Skeleton list of cards shown while a screen loads. */
export function LoadingState({ rows = 4, message }: { rows?: number; message?: string }) {
    return (
        <View style={styles.container} accessibilityLabel={message ?? 'Loading'} accessibilityRole="progressbar">
            {Array.from({ length: rows }).map((_, index) => (
                <View key={index} style={styles.card}>
                    <SkeletonBlock style={styles.icon} />
                    <View style={styles.lines}>
                        <SkeletonBlock style={styles.lineWide} />
                        <SkeletonBlock style={styles.lineMid} />
                        <SkeletonBlock style={styles.lineShort} />
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        gap: 14,
        padding: 16,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    block: {
        backgroundColor: '#E4EAF1',
        borderRadius: 6,
    },
    icon: {
        width: 44,
        height: 44,
        borderRadius: 14,
    },
    lines: {
        flex: 1,
        gap: 8,
        paddingTop: 2,
    },
    lineWide: {
        height: 13,
        width: '85%',
    },
    lineMid: {
        height: 11,
        width: '60%',
    },
    lineShort: {
        height: 11,
        width: '40%',
    },
});

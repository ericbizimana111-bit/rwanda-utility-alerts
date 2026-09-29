import React, { useId } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface GradientBackgroundProps {
    colors: readonly string[];
    /** Diagonal (default) or vertical gradient. */
    direction?: 'diagonal' | 'vertical' | 'horizontal';
    /** Adds soft decorative circles, used on hero headers. */
    decorated?: boolean;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

/** A view filled with a linear gradient, drawn with react-native-svg. */
export function GradientBackground({ colors, direction = 'diagonal', decorated = false, style, children }: GradientBackgroundProps) {
    const id = `grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const end = direction === 'vertical' ? { x2: '0', y2: '1' } : direction === 'horizontal' ? { x2: '1', y2: '0' } : { x2: '1', y2: '1' };

    return (
        <View style={[styles.container, style]}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                    <LinearGradient id={id} x1="0" y1="0" {...end}>
                        {colors.map((color, index) => (
                            <Stop key={`${color}-${index}`} offset={colors.length === 1 ? 0 : index / (colors.length - 1)} stopColor={color} />
                        ))}
                    </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
                {decorated ? (
                    <>
                        <Circle cx="92%" cy="8%" r="90" fill="#FFFFFF" opacity={0.06} />
                        <Circle cx="78%" cy="95%" r="60" fill="#FFFFFF" opacity={0.05} />
                        <Circle cx="4%" cy="70%" r="40" fill="#FFFFFF" opacity={0.04} />
                    </>
                ) : null}
            </Svg>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

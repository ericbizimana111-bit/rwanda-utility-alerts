import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface LogoEmblemProps {
    size?: number;
    showGlow?: boolean;
}

export function LogoEmblem({ size = 56, showGlow = false }: LogoEmblemProps) {
    return (
        <View style={[styles.wrapper, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="logoRing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#2563EB" />
                        <Stop offset="50%" stopColor="#0B63C5" />
                        <Stop offset="100%" stopColor="#0284C7" />
                    </LinearGradient>
                    <LinearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FBBF24" />
                        <Stop offset="100%" stopColor="#F59E0B" />
                    </LinearGradient>
                    <LinearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#38BDF8" />
                        <Stop offset="100%" stopColor="#0284C7" />
                    </LinearGradient>
                </Defs>

                {/* Outer Ring */}
                <Circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="url(#logoRing)" strokeWidth="6" />

                {/* Water Drop Shape (Right/Bottom) */}
                <Path
                    d="M 52 24 C 52 24, 72 44, 72 58 C 72 70, 62 78, 50 78 C 38 78, 30 70, 30 58 C 30 47, 44 32, 52 24 Z"
                    fill="url(#waterGrad)"
                    opacity="0.95"
                />

                {/* Stylized Lightning Bolt (Left/Center cutting across) */}
                <Path
                    d="M 48 18 L 32 48 L 48 48 L 42 80 L 66 44 L 50 44 Z"
                    fill="url(#boltGrad)"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

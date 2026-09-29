import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';

/** Thin stripe in the colours of the Rwandan flag (blue, yellow, green). */
export function FlagStripe({ height = 3, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
    return (
        <View style={[styles.row, { height }, style]}>
            <View style={[styles.blue]} />
            <View style={[styles.yellow]} />
            <View style={[styles.green]} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    // The flag's blue band is twice the height of the yellow and green bands.
    blue: { flex: 2, backgroundColor: colors.flagBlue },
    yellow: { flex: 1, backgroundColor: colors.flagYellow },
    green: { flex: 1, backgroundColor: colors.flagGreen },
});

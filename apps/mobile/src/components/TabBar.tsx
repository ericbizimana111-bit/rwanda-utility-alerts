import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, shadows } from '../theme/colors';
import { Icon, IconName } from './Icon';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
    Home: { label: 'Home', icon: 'home' },
    Outages: { label: 'Outages', icon: 'outages' },
    Subscriptions: { label: 'My Areas', icon: 'map-pin' },
    Reports: { label: 'Report', icon: 'message' },
    Profile: { label: 'Profile', icon: 'user' },
};

/** Bottom tab bar with an active pill indicator. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const bottom = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);

    return (
        <View style={[styles.container, { paddingBottom: bottom }]}>
            {state.routes.map((route, index) => {
                const focused = state.index === index;
                const meta = TAB_META[route.name] ?? { label: route.name, icon: 'more' as IconName };
                const color = focused ? colors.primary : colors.textMuted;

                return (
                    <Pressable
                        key={route.key}
                        style={styles.tab}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: focused }}
                        accessibilityLabel={meta.label}
                        onPress={() => {
                            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                        }}
                    >
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Icon name={meta.icon} size={21} color={color} />
                        </View>
                        <Text style={[styles.label, { color }, focused && styles.labelActive]}>{meta.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        paddingTop: 8,
        ...shadows.card,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },
    iconWrap: {
        width: 52,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: colors.primaryLight,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
    },
    labelActive: {
        fontWeight: '800',
    },
});

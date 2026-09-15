import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Icon } from './Icon';

export type BottomTabKey = 'Home' | 'Outages' | 'Subscriptions' | 'Reports' | 'More';

interface BottomNavigationProps {
    activeTab: BottomTabKey;
    onTabPress: (tab: BottomTabKey) => void;
}

export function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
    const insets = useSafeAreaInsets();
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 14);

    const tabs: Array<{ key: BottomTabKey; label: string; icon: any }> = [
        { key: 'Home', label: 'Home', icon: 'home' },
        { key: 'Outages', label: 'Outages', icon: 'outages' },
        { key: 'Subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
        { key: 'Reports', label: 'Reports', icon: 'reports' },
        { key: 'More', label: 'More', icon: 'more' },
    ];

    return (
        <View style={[styles.container, { paddingBottom: bottomInset }]}>
            <View style={styles.tabsRow}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const color = isActive ? colors.primary : colors.textSecondary;

                    return (
                        <Pressable
                            key={tab.key}
                            style={styles.tabButton}
                            onPress={() => onTabPress(tab.key)}
                        >
                            <Icon name={tab.icon} size={22} color={color} />
                            <Text style={[styles.tabLabel, { color }, isActive && styles.tabLabelActive]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
    },
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        gap: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    tabLabelActive: {
        fontWeight: '700',
    },
});

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { OutageCard } from '../components/OutageCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { api, Outage } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Outages'>;
type TabType = 'upcoming' | 'active';

export function OutagesScreen({ navigation }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [upcomingItems, setUpcomingItems] = useState<Outage[]>([]);
    const [activeItems, setActiveItems] = useState<Outage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadOutages() {
        setLoading(true);
        setError(null);
        try {
            const [upcoming, active] = await Promise.all([
                api.getUpcomingOutages(),
                api.getActiveOutages(),
            ]);
            setUpcomingItems(upcoming);
            setActiveItems(active);
        } catch {
            setError('Unable to load outages.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadOutages();
    }, []);

    const displayedItems = activeTab === 'upcoming' ? upcomingItems : activeItems;

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader title="Outages" />

            <View style={styles.container}>
                {/* Segmented Tabs */}
                <View style={styles.tabBar}>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text
                            style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}
                        >
                            Upcoming ({upcomingItems.length})
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                            Active ({activeItems.length})
                        </Text>
                    </Pressable>
                </View>

                {/* Content */}
                {loading ? (
                    <LoadingState message="Loading outages..." />
                ) : error ? (
                    <ErrorState onRetry={loadOutages} />
                ) : displayedItems.length === 0 ? (
                    <EmptyState
                        title="No active outages"
                        description="There are currently no active utility outages in your area."
                        buttonTitle=""
                    />
                ) : (
                    <FlatList
                        data={displayedItems}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <OutageCard
                                outage={item}
                                onPress={() => navigation.navigate('OutageDetails', { outageId: item.id })}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            <BottomNavigation
                activeTab="Outages"
                onTabPress={(tab) => {
                    if (tab === 'Home') navigation.navigate('Home');
                    else if (tab === 'Subscriptions') navigation.navigate('Subscriptions');
                    else if (tab === 'Reports') navigation.navigate('Reports');
                    else if (tab === 'More') navigation.navigate('Profile');
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.headerBg,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
});

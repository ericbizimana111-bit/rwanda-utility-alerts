import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { TabScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { OutageCard } from '../components/OutageCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Chip, SegmentedControl } from '../components/ui';
import { api } from '../api/client';
import { useLoader } from '../hooks/useLoader';
import { outageAffectsSubscription, utilityKind, UtilityKind } from '../utils/outage';

type Phase = 'active' | 'upcoming';

async function loadOutages() {
    const [upcoming, active, subscriptions] = await Promise.all([
        api.getUpcomingOutages(),
        api.getActiveOutages(),
        api.getSubscriptions().catch(() => []),
    ]);
    return { upcoming, active, subscriptions };
}

export function OutagesScreen({ navigation, route }: TabScreenProps<'Outages'>) {
    const [phase, setPhase] = useState<Phase>(route.params?.phase ?? 'upcoming');
    const [utility, setUtility] = useState<UtilityKind | 'all'>('all');
    const [mineOnly, setMineOnly] = useState(false);
    const { data, error, loading, refreshing, refresh, retry } = useLoader(loadOutages, 'Unable to load outages.');

    // Home screen shortcuts open a specific tab.
    useEffect(() => {
        if (route.params?.phase) setPhase(route.params.phase);
    }, [route.params?.phase]);

    const items = useMemo(() => {
        if (!data) return [];
        const source = phase === 'active' ? data.active : data.upcoming;
        return source.filter((outage) => {
            if (utility !== 'all' && utilityKind(outage.utility) !== utility) return false;
            if (mineOnly && !data.subscriptions.some((subscription) => outageAffectsSubscription(outage, subscription))) return false;
            return true;
        });
    }, [data, phase, utility, mineOnly]);

    const affects = (outageId: string) => {
        const outage = items.find((item) => item.id === outageId);
        return Boolean(outage && data?.subscriptions.some((subscription) => outageAffectsSubscription(outage, subscription)));
    };

    return (
        <View style={styles.screen}>
            <AppHeader title="Outages" subtitle="Electricity and water interruptions in Rwanda">
                <SegmentedControl
                    value={phase}
                    onChange={setPhase}
                    options={[
                        { value: 'upcoming', label: 'Scheduled', count: data?.upcoming.length },
                        { value: 'active', label: 'In progress', count: data?.active.length },
                    ]}
                    style={styles.segmented}
                />
            </AppHeader>

            <View style={styles.filters}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Chip label="All" selected={utility === 'all'} onPress={() => setUtility('all')} />
                    <Chip label="Electricity" icon="lightning" iconColor={colors.electricityIcon} selected={utility === 'electricity'} onPress={() => setUtility('electricity')} />
                    <Chip label="Water" icon="water" iconColor={colors.waterIcon} selected={utility === 'water'} onPress={() => setUtility('water')} />
                    <Chip label="My areas only" icon="map-pin" iconColor={colors.primary} selected={mineOnly} onPress={() => setMineOnly((value) => !value)} />
                </ScrollView>
            </View>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState title="Couldn't load outages" description={error} onRetry={() => void retry()} />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={items.length ? styles.list : styles.emptyList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />}
                    renderItem={({ item }) => (
                        <OutageCard
                            outage={item}
                            affectsYou={affects(item.id)}
                            onPress={() => navigation.navigate('OutageDetails', { outageId: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="check-circle"
                            iconColor={colors.success}
                            iconBg={colors.successBg}
                            title={phase === 'active' ? 'No interruptions in progress' : 'Nothing scheduled'}
                            description={
                                mineOnly
                                    ? 'No interruptions match the areas you follow.'
                                    : phase === 'active'
                                        ? 'No announced electricity or water interruption is under way right now.'
                                        : 'REG and WASAC have not announced any upcoming interruptions that match these filters.'
                            }
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    segmented: {
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    filters: {
        paddingTop: 12,
    },
    filterRow: {
        paddingHorizontal: 16,
        gap: 8,
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyList: {
        flexGrow: 1,
    },
});

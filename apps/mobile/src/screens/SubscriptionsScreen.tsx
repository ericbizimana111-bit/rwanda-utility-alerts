import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { TabScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Dialog } from '../components/Dialog';
import { Button, InfoNote } from '../components/ui';
import { api, errorMessage, Subscription } from '../api/client';
import { useLoader } from '../hooks/useLoader';
import { locationLabel, outageAffectsSubscription, outagePhase, UTILITY_THEME, utilityKind } from '../utils/outage';

async function loadAreas() {
    const [subscriptions, active, upcoming] = await Promise.all([
        api.getSubscriptions(),
        api.getActiveOutages().catch(() => []),
        api.getUpcomingOutages().catch(() => []),
    ]);
    return { subscriptions, outages: [...active, ...upcoming].filter((outage) => outagePhase(outage) !== 'ended') };
}

export function SubscriptionsScreen({ navigation }: TabScreenProps<'Subscriptions'>) {
    const { data, setData, error, loading, refreshing, refresh, retry } = useLoader(loadAreas, 'Unable to load the areas you follow.');
    const [selected, setSelected] = useState<Subscription | null>(null);
    const [removing, setRemoving] = useState(false);
    const [removeError, setRemoveError] = useState<string | null>(null);

    const counts = useMemo(() => {
        const result = new Map<string, number>();
        for (const subscription of data?.subscriptions ?? []) {
            result.set(
                subscription.id,
                (data?.outages ?? []).filter((outage) => outageAffectsSubscription(outage, subscription)).length,
            );
        }
        return result;
    }, [data]);

    async function remove() {
        if (!selected || !data) return;
        setRemoving(true);
        setRemoveError(null);
        try {
            await api.deleteSubscription(selected.id);
            setData({ ...data, subscriptions: data.subscriptions.filter((item) => item.id !== selected.id) });
            setSelected(null);
        } catch (err) {
            setRemoveError(errorMessage(err, 'Unable to remove this area right now.'));
        } finally {
            setRemoving(false);
        }
    }

    const count = data?.subscriptions.length ?? 0;

    return (
        <View style={styles.screen}>
            <AppHeader
                title="My areas"
                subtitle={count ? `Following ${count} area${count === 1 ? '' : 's'}` : 'Choose where you want alerts'}
            />

            {loading ? (
                <LoadingState rows={3} />
            ) : error ? (
                <ErrorState title="Couldn't load your areas" description={error} onRetry={() => void retry()} />
            ) : (
                <FlatList
                    data={data?.subscriptions ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={count ? styles.list : styles.emptyList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />}
                    ListHeaderComponent={
                        count ? (
                            <View style={styles.headerBlock}>
                                <Button title="Follow another area" icon="plus" onPress={() => navigation.navigate('AddSubscription')} />
                                <InfoNote>
                                    Following a whole district alerts you about every sector in it. Following a sector also alerts you when the whole district is affected.
                                </InfoNote>
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <SubscriptionCard
                            subscription={item}
                            outageCount={counts.get(item.id) ?? 0}
                            onRemove={() => {
                                setRemoveError(null);
                                setSelected(item);
                            }}
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="map-pin"
                            title="You're not following any area yet"
                            description="Follow your home, work or family's area to get alerts before electricity or water interruptions begin."
                            buttonTitle="Follow an area"
                            onButtonPress={() => navigation.navigate('AddSubscription')}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Dialog
                visible={!!selected}
                onClose={() => setSelected(null)}
                icon="bell-off"
                tone="danger"
                title="Stop following this area?"
                message={
                    selected
                        ? `You will no longer get ${UTILITY_THEME[utilityKind(selected.utility)].label.toLowerCase()} alerts for ${locationLabel(selected.location)}.`
                        : undefined
                }
                dismissable={!removing}
                actions={
                    <>
                        <Button title="Keep" variant="ghost" size="md" onPress={() => setSelected(null)} disabled={removing} style={styles.flex} />
                        <Button title="Stop alerts" variant="danger" size="md" onPress={() => void remove()} loading={removing} style={styles.flex} />
                    </>
                }
            >
                {removeError ? <Text style={styles.error}>{removeError}</Text> : null}
            </Dialog>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyList: {
        flexGrow: 1,
    },
    headerBlock: {
        gap: 12,
        marginBottom: 16,
    },
    flex: {
        flex: 1,
    },
    error: {
        fontSize: 13,
        color: colors.danger,
    },
});

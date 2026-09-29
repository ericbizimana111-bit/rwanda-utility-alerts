import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Text } from 'react-native';
import { RootScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { NotificationCard } from '../components/NotificationCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SegmentedControl } from '../components/ui';
import { api, NotificationItem } from '../api/client';
import { useLoader } from '../hooks/useLoader';

type Filter = 'all' | 'unread';

export function NotificationsScreen({ navigation }: RootScreenProps<'Notifications'>) {
    const [filter, setFilter] = useState<Filter>('all');
    const [markingAll, setMarkingAll] = useState(false);
    const { data, setData, error, loading, refreshing, refresh, retry } = useLoader(
        () => api.getNotificationList(),
        'Unable to load your alerts.',
    );

    const items = data ?? [];
    const unread = items.filter((item) => !item.isRead);
    const shown = useMemo(() => (filter === 'unread' ? items.filter((item) => !item.isRead) : items), [items, filter]);

    function markLocally(ids: string[]) {
        setData((current) => (current ?? []).map((item) => (ids.includes(item.id) ? { ...item, isRead: true } : item)));
    }

    async function open(item: NotificationItem) {
        if (!item.isRead) {
            markLocally([item.id]);
            api.markNotificationRead(item.id).catch(() => undefined);
        }
        if (item.outageId) navigation.navigate('OutageDetails', { outageId: item.outageId });
    }

    async function markAllRead() {
        setMarkingAll(true);
        const ids = unread.map((item) => item.id);
        const results = await Promise.allSettled(ids.map((id) => api.markNotificationRead(id)));
        markLocally(ids.filter((_, index) => results[index].status === 'fulfilled'));
        setMarkingAll(false);
    }

    return (
        <View style={styles.screen}>
            <AppHeader
                title="Alerts"
                subtitle={unread.length ? `${unread.length} unread` : 'You are all caught up'}
                showBack
                onBack={() => navigation.goBack()}
                rightIcon={
                    unread.length ? (
                        <Pressable onPress={() => void markAllRead()} disabled={markingAll} hitSlop={8} style={styles.markAll} accessibilityRole="button">
                            <Text style={styles.markAllText}>{markingAll ? 'Marking…' : 'Mark all read'}</Text>
                        </Pressable>
                    ) : null
                }
            >
                <SegmentedControl
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { value: 'all', label: 'All', count: items.length },
                        { value: 'unread', label: 'Unread', count: unread.length },
                    ]}
                    onDark
                />
            </AppHeader>

            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState title="Couldn't load alerts" description={error} onRetry={() => void retry()} />
            ) : (
                <FlatList
                    data={shown}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={shown.length ? styles.list : styles.emptyList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />}
                    renderItem={({ item }) => <NotificationCard notification={item} onPress={() => void open(item)} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="bell"
                            title={filter === 'unread' ? 'No unread alerts' : 'No alerts yet'}
                            description="When an interruption is announced for an area you follow, the alert will appear here and on your phone."
                            buttonTitle={filter === 'all' ? 'Manage my areas' : undefined}
                            onButtonPress={() => navigation.navigate('Main', { screen: 'Subscriptions' })}
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
    markAll: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    markAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyList: {
        flexGrow: 1,
    },
});

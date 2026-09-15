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
import { NotificationCard } from '../components/NotificationCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { api, ApiError, NotificationItem } from '../api/client';
import { formatRelativeTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
type TabType = 'all' | 'unread' | 'read';

export function NotificationsScreen({ navigation }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadNotifications() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getNotificationList();
            setItems(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unable to load your notifications.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadNotifications();
    }, []);

    const filteredItems = items.filter((item) => {
        if (activeTab === 'unread') return !item.isRead;
        if (activeTab === 'read') return item.isRead;
        return true;
    });

    async function handleNotificationPress(item: NotificationItem) {
        if (!item.isRead) {
            try {
                await api.markNotificationRead(item.id);
                setItems((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
            } catch {
                // Marking as read failed; the notification stays unread and can
                // be tapped again. Navigation still proceeds.
            }
        }
        // Any notification tied to a real outage opens that outage. Real IDs
        // are UUIDs, so no format sniffing is needed.
        if (item.outageId) {
            navigation.navigate('OutageDetails', { outageId: item.outageId });
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Alerts"
                showBack
                onBack={() => navigation.goBack()}
            />

            <View style={styles.container}>
                {/* Tabs: All / Unread / Read */}
                <View style={styles.tabBar}>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                            All
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.tabButton, activeTab === 'unread' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('unread')}
                    >
                        <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
                            Unread
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.tabButton, activeTab === 'read' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('read')}
                    >
                        <Text style={[styles.tabText, activeTab === 'read' && styles.tabTextActive]}>
                            Read
                        </Text>
                    </Pressable>
                </View>

                {/* Notifications List */}
                {loading ? (
                    <LoadingState message="Loading alerts..." />
                ) : error ? (
                    <ErrorState
                        title="Unable to load alerts"
                        description={error}
                        buttonTitle="Retry"
                        onRetry={() => void loadNotifications()}
                    />
                ) : filteredItems.length === 0 ? (
                    <EmptyState
                        title="No notifications"
                        description="You're all caught up with utility updates."
                        buttonTitle=""
                    />
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <NotificationCard
                                notification={item}
                                onPress={() => void handleNotificationPress(item)}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            <BottomNavigation
                activeTab="More"
                onTabPress={(tab) => {
                    if (tab === 'Home') navigation.navigate('Home');
                    else if (tab === 'Outages') navigation.navigate('Outages');
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

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api, NotificationItem } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

function NotificationCard({ item, onPress, onMarkRead }: { item: NotificationItem; onPress: () => void; onMarkRead: () => void }) {
    return (
        <Pressable style={[styles.card, !item.isRead && styles.cardUnread]} onPress={onPress}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.cardMessage}>{item.message}</Text>
            <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
                {!item.isRead && (
                    <Pressable style={styles.markRead} onPress={onMarkRead}>
                        <Text style={styles.markText}>Mark as read</Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    );
}

export function NotificationsScreen({ navigation }: Props) {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.getNotificationList();
                if (!cancelled) setItems(data);
            } catch {
                if (!cancelled) setError('Unable to load notifications.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, []);

    async function markRead(id: string) {
        try {
            await api.markNotificationRead(id);
            setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isRead: true } : it)));
        } catch {
            // non-fatal
        }
    }

    function openOutage(item: NotificationItem) {
        if (!item.outageId) return;
        navigation.navigate('OutageDetails', { outageId: item.outageId });
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : error ? (
                <View style={styles.empty}><Text style={styles.emptyText}>{error}</Text></View>
            ) : items.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>No notifications yet. Outage alerts will appear here.</Text></View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationCard
                            item={item}
                            onPress={() => openOutage(item)}
                            onMarkRead={() => markRead(item.id)}
                        />
                    )}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { padding: 16 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#123047' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#526674', textAlign: 'center' },
    list: { padding: 12 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardUnread: { borderLeftColor: '#087f8c', borderLeftWidth: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#123047', flex: 1 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#087f8c' },
    cardMessage: { color: '#526674', lineHeight: 20, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardMeta: { color: '#526674', fontSize: 13 },
    markRead: { backgroundColor: '#f7fafc', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#d8e1e8' },
    markText: { color: '#087f8c', fontWeight: '600', fontSize: 13 },
});

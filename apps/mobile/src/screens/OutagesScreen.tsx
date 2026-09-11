import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api, Outage } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Outages'>;

type ListTab = 'upcoming' | 'active';

function OutageCard({ outage, onPress }: { outage: Outage; onPress: () => void }) {
    const locations = (outage.outageLocations || [])
        .map((item) => [item.location?.district, item.location?.sector].filter(Boolean).join(', '))
        .filter(Boolean)
        .join('; ');
    return (
        <Pressable style={styles.card} onPress={onPress}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardUtility}>{outage.utility?.name || 'Utility'} · {outage.status}</Text>
                <Text style={styles.cardSource}>{outage.sourceName ? outage.sourceName : 'Official source'}</Text>
            </View>
            <Text style={styles.cardTitle}>{outage.title}</Text>
            <Text style={styles.cardDescription}>{outage.description || 'No additional description was provided.'}</Text>
            <View style={styles.cardMeta}>
                <Text style={styles.metaLabel}>Affected locations</Text>
                <Text style={styles.metaValue}>{locations || 'Location details unavailable'}</Text>
            </View>
            <View style={styles.cardMeta}>
                <Text style={styles.metaLabel}>Timing</Text>
                <Text style={styles.metaValue}>
                    {outage.startTime || 'Start time unavailable'}
                    {outage.endTime ? ` - ${outage.endTime}` : ''}
                </Text>
            </View>
        </Pressable>
    );
}

export function OutagesScreen({ navigation }: Props) {
    const [tab, setTab] = useState<ListTab>('upcoming');
    const [items, setItems] = useState<Outage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = tab === 'upcoming' ? await api.getUpcomingOutages() : await api.getActiveOutages();
                if (!cancelled) setItems(data);
            } catch {
                if (!cancelled) setError('Unable to load outages.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [tab]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabs}>
                <Pressable style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
                    <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
                </Pressable>
                <Pressable style={[styles.tab, tab === 'active' && styles.tabActive]} onPress={() => setTab('active')}>
                    <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</Text>
                </Pressable>
            </View>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : error ? (
                <View style={styles.empty}><Text style={styles.emptyText}>{error}</Text></View>
            ) : items.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>No {tab} outages are available right now.</Text></View>
            ) : (
                <View style={styles.list}>
                    {items.map((outage) => (
                        <OutageCard
                            key={outage.id}
                            outage={outage}
                            onPress={() => navigation.navigate('OutageDetails', { outageId: outage.id })}
                        />
                    ))}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    tabs: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
    tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d8e1e8' },
    tabActive: { backgroundColor: '#123047', borderColor: '#123047' },
    tabText: { color: '#526674', fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#526674', textAlign: 'center' },
    list: { flex: 1, padding: 12 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardUtility: { color: '#087f8c', fontWeight: '600', fontSize: 13 },
    cardSource: { color: '#526674', fontSize: 12 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#123047', marginBottom: 6 },
    cardDescription: { color: '#526674', lineHeight: 20, marginBottom: 10 },
    cardMeta: { marginTop: 8 },
    metaLabel: { fontSize: 12, fontWeight: '700', color: '#123047', marginBottom: 2 },
    metaValue: { color: '#526674', lineHeight: 18 },
});

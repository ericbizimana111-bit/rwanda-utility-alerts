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
import { api, Report } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

function StatusBadge({ status }: { status: string }) {
    const color = status === 'verified' ? '#087f8c' : status === 'rejected' ? '#b42318' : status === 'resolved' ? '#123047' : '#526674';
    return <View style={[styles.badge, { backgroundColor: color }]}><Text style={styles.badgeText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text></View>;
}

function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
    const location = report.location;
    const utility = report.utility;
    return (
        <Pressable style={styles.card} onPress={onPress}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{utility?.name || 'Utility'} — {location?.district || 'Location'}</Text>
                <StatusBadge status={report.status} />
            </View>
            <Text style={styles.cardDescription}>{report.description}</Text>
            <Text style={styles.cardMeta}>{location ? `${location.province}${location.sector ? ', ' + location.sector : ''}` : ''}</Text>
            <Text style={styles.cardMeta}>Submitted {new Date(report.createdAt).toLocaleString()}</Text>
        </Pressable>
    );
}

export function ReportsScreen({ navigation }: Props) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.getReports();
                if (!cancelled) setReports(data);
            } catch {
                if (!cancelled) setError('Unable to load your reports.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Your reports</Text>
                <Pressable style={styles.addButton} onPress={() => navigation.navigate('ReportCreate', {})}>
                    <Text style={styles.addButtonText}>New report</Text>
                </Pressable>
            </View>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : error ? (
                <View style={styles.empty}><Text style={styles.emptyText}>{error}</Text></View>
            ) : reports.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>No reports submitted yet.</Text></View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ReportCard
                            report={item}
                            onPress={() => navigation.navigate('ReportCreate', { reportId: item.id })}
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, gap: 12 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#123047' },
    addButton: { backgroundColor: '#087f8c', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    addButtonText: { color: '#fff', fontWeight: '600' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: '#526674', textAlign: 'center' },
    list: { padding: 12 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#123047', flex: 1 },
    badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardDescription: { color: '#526674', lineHeight: 20, marginBottom: 8 },
    cardMeta: { color: '#526674', fontSize: 14, marginTop: 4 },
});

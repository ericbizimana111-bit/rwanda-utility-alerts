import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api, Outage } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'OutageDetails'>;

export function OutageDetailsScreen({ route }: Props) {
    const [outage, setOutage] = useState<Outage | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!route.params.outageId) return;
        api.getOutage(route.params.outageId).then(setOutage).catch(() => setError(true));
    }, [route.params.outageId]);

    if (!route.params.outageId) return <SafeAreaView style={styles.container}><Text style={styles.error}>No outage was selected.</Text></SafeAreaView>;
    if (error) return <SafeAreaView style={styles.container}><Text style={styles.error}>This outage could not be loaded.</Text></SafeAreaView>;
    if (!outage) return <SafeAreaView style={styles.container}><ActivityIndicator /></SafeAreaView>;

    const locations = (outage.outageLocations || []).map((item) => [item.location?.district, item.location?.sector].filter(Boolean).join(', ')).filter(Boolean).join('; ');
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{outage.title}</Text>
                <Text style={styles.meta}>{outage.utility?.name || 'Utility'} · {outage.status}</Text>
                <Text style={styles.body}>{outage.description || 'No additional description was provided.'}</Text>
                <Text style={styles.label}>Affected locations</Text>
                <Text style={styles.body}>{locations || 'Location details unavailable'}</Text>
                <Text style={styles.label}>Timing</Text>
                <Text style={styles.body}>{outage.startTime || 'Start time unavailable'}{outage.endTime ? ` - ${outage.endTime}` : ''}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    content: { padding: 24, gap: 14 },
    title: { fontSize: 25, fontWeight: '700', color: '#123047' },
    meta: { color: '#087f8c', fontWeight: '600' },
    label: { color: '#123047', fontWeight: '700', marginTop: 12 },
    body: { color: '#526674', lineHeight: 22 },
    error: { padding: 24, color: '#b42318' },
});

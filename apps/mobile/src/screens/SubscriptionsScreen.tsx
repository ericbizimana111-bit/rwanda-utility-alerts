import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api, Location, Subscription, Utility } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscriptions'>;

type Segment = 'list' | 'subscribe';

function SubCard({ subscription, onUnsubscribe }: { subscription: Subscription; onUnsubscribe: () => void }) {
    const location = subscription.location;
    const utility = subscription.utility;
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{utility?.name || 'Utility'} — {location?.district || 'Location'}</Text>
                <Text style={styles.cardMeta}>{location ? `${location.province}${location.sector ? ', ' + location.sector : ''}` : ''}</Text>
            </View>
            <Pressable style={styles.unsubscribe} onPress={onUnsubscribe}>
                <Text style={styles.unsubscribeText}>Unsubscribe</Text>
            </Pressable>
        </View>
    );
}

function OptionRow({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable style={styles.option} onPress={onPress}>
            <Text style={styles.optionLabel}>{label}</Text>
        </Pressable>
    );
}

export function SubscriptionsScreen({ navigation }: Props) {
    const [segment, setSegment] = useState<Segment>('list');
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [selectedUtilityId, setSelectedUtilityId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const loadList = useCallback(async () => {
        try {
            const data = await api.getSubscriptions();
            setSubscriptions(data);
        } catch {
            setError('Unable to load subscriptions.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadOptions = useCallback(async () => {
        try {
            const [locs, utils] = await Promise.all([api.getLocations(), api.getUtilities()]);
            setLocations(locs);
            setUtilities(utils);
        } catch {
            setError('Unable to load locations or utilities.');
        } finally {
            setLoadingOptions(false);
        }
    }, []);

    useEffect(() => { void loadList(); }, [loadList]);
    useEffect(() => { void loadOptions(); }, [loadOptions]);

    async function onCreate() {
        if (!selectedLocationId || !selectedUtilityId) return;
        setCreateError(null);
        setCreating(true);
        try {
            await api.createSubscription(selectedLocationId, selectedUtilityId);
            setSelectedLocationId(null);
            setSelectedUtilityId(null);
            setSegment('list');
            await loadList();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Unable to subscribe.');
        } finally {
            setCreating(false);
        }
    }

    async function onUnsubscribe(id: string) {
        try {
            await api.deleteSubscription(id);
            setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        } catch {
            // keep list as is, error is non-fatal
        }
    }

    const locationOptions = locations.map((loc) => ({
        label: loc.sector ? `${loc.district} — ${loc.sector}` : loc.district,
        value: loc.id,
    }));
    const utilityOptions = utilities.map((u) => ({ label: u.name, value: u.id }));

    return (
        <SafeAreaView style={styles.container}>
            {segment === 'list' ? (
                <>
                    <View style={styles.header}>
                        <Text style={styles.sectionTitle}>Your subscriptions</Text>
                        <Pressable style={styles.addButton} onPress={() => setSegment('subscribe')}>
                            <Text style={styles.addButtonText}>Subscribe to a location</Text>
                        </Pressable>
                    </View>
                    {loading ? (
                        <ActivityIndicator style={styles.loader} />
                    ) : error ? (
                        <View style={styles.empty}><Text style={styles.emptyText}>{error}</Text></View>
                    ) : subscriptions.length === 0 ? (
                        <View style={styles.empty}><Text style={styles.emptyText}>No subscriptions yet. Subscribe to a location to receive alerts.</Text></View>
                    ) : (
                        <FlatList
                            data={subscriptions}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <SubCard subscription={item} onUnsubscribe={() => onUnsubscribe(item.id)} />
                            )}
                            contentContainerStyle={styles.list}
                        />
                    )}
                </>
            ) : (
                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Subscribe</Text>
                    <Text style={styles.formLabel}>Utility</Text>
                    <View style={styles.options}>
                        {utilityOptions.map((opt) => (
                            <OptionRow
                                key={opt.value}
                                label={opt.label}
                                onPress={() => setSelectedUtilityId(selectedUtilityId === opt.value ? null : opt.value)}
                            />
                        ))}
                    </View>
                    {selectedUtilityId && (
                        <Text style={styles.formLabel}>Location</Text>
                    )}
                    <View style={styles.options}>
                        {locationOptions.map((opt) => (
                            <OptionRow
                                key={opt.value}
                                label={opt.label}
                                onPress={() => setSelectedLocationId(selectedLocationId === opt.value ? null : opt.value)}
                            />
                        ))}
                    </View>
                    {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
                    <Pressable style={!selectedLocationId || !selectedUtilityId ? styles.submitDisabled : styles.submit} onPress={onCreate} disabled={!selectedLocationId || !selectedUtilityId}>
                        <Text style={styles.submitText}>{creating ? 'Subscribing...' : 'Subscribe'}</Text>
                    </Pressable>
                    <Pressable style={styles.backButton} onPress={() => setSegment('list')}>
                        <Text style={styles.backButtonText}>Back to subscriptions</Text>
                    </Pressable>
                </View>
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
    cardHeader: { marginBottom: 10 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#123047' },
    cardMeta: { color: '#526674', marginTop: 4 },
    unsubscribe: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#f7fafc', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#d8e1e8' },
    unsubscribeText: { color: '#b42318', fontWeight: '600' },
    form: { flex: 1, padding: 16 },
    formLabel: { fontSize: 14, fontWeight: '700', color: '#123047', marginTop: 12, marginBottom: 6 },
    options: { gap: 8 },
    option: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    optionLabel: { fontSize: 15, color: '#123047' },
    errorText: { color: '#b42318', marginTop: 12 },
    submit: { marginTop: 16, backgroundColor: '#123047', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    submitDisabled: { backgroundColor: '#cbd5e1' },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    backButton: { marginTop: 12, alignItems: 'center' },
    backButtonText: { color: '#087f8c', fontWeight: '600' },
});

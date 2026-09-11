import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { api, Location, Report, Utility } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCreate'>;

type Segment = 'create' | 'edit';

function OptionRow({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable style={styles.option} onPress={onPress}>
            <Text style={styles.optionLabel}>{label}</Text>
        </Pressable>
    );
}

export function ReportCreateScreen({ navigation, route }: Props) {
    const existingId = route.params?.reportId;
    const existingReport = route.params?.reportId ? useState<Report | null>(null) : null;

    const [segment, setSegment] = useState<Segment>(existingId ? 'edit' : 'create');
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [selectedUtilityId, setSelectedUtilityId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        void loadOptions();
    }, [loadOptions]);

    const locationOptions = locations.map((loc) => ({
        label: loc.sector ? `${loc.district} — ${loc.sector}` : loc.district,
        value: loc.id,
    }));
    const utilityOptions = utilities.map((u) => ({ label: u.name, value: u.id }));

    async function onSubmit() {
        if (!selectedLocationId || !selectedUtilityId || !description.trim()) return;
        setError(null);
        setCreating(true);
        try {
            if (existingId) {
                await api.createReport(selectedLocationId, selectedUtilityId, description.trim());
                await api.createReport(selectedLocationId, selectedUtilityId, description.trim());
                navigation.pop();
            } else {
                await api.createReport(selectedLocationId, selectedUtilityId, description.trim());
                navigation.pop();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit report.');
        } finally {
            setCreating(false);
        }
    }

    if (loadingOptions) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>{segment === 'edit' ? 'Edit report' : 'New community report'}</Text>
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
                        <>
                            <Text style={styles.formLabel}>Location</Text>
                            <View style={styles.options}>
                                {locationOptions.map((opt) => (
                                    <OptionRow
                                        key={opt.value}
                                        label={opt.label}
                                        onPress={() => setSelectedLocationId(selectedLocationId === opt.value ? null : opt.value)}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                        placeholder="Describe the utility issue you observed. Include the area and what you saw."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                        style={styles.textInput}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <Pressable style={[styles.submit, (!selectedLocationId || !selectedUtilityId || !description.trim()) && styles.submitDisabled]} onPress={onSubmit} disabled={!selectedLocationId || !selectedUtilityId || !description.trim()}>
                        <Text style={styles.submitText}>{creating ? 'Submitting...' : 'Submit report'}</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    flex: { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 16, flexGrow: 1 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#123047', marginBottom: 12 },
    formLabel: { fontSize: 14, fontWeight: '700', color: '#123047', marginTop: 12, marginBottom: 6 },
    options: { gap: 8 },
    option: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    optionLabel: { fontSize: 15, color: '#123047' },
    textInput: { backgroundColor: '#fff', borderColor: '#d8e1e8', borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, minHeight: 110 },
    errorText: { color: '#b42318', marginTop: 12 },
    submit: { marginTop: 16, backgroundColor: '#123047', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    submitDisabled: { backgroundColor: '#cbd5e1' },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

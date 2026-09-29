import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RootScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { SearchablePicker } from '../components/SearchablePicker';
import { UtilityChoice, UtilitySelector } from '../components/UtilitySelector';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Dialog } from '../components/Dialog';
import { Button, Card, InfoNote } from '../components/ui';
import { api, ApiError, errorMessage } from '../api/client';
import { useLocationOptions } from '../hooks/useLocationOptions';
import { utilityKind } from '../utils/outage';

export function AddSubscriptionScreen({ navigation }: RootScreenProps<'AddSubscription'>) {
    const { locations, utilities, districtOptions, sectorOptions, loading, error, reload } = useLocationOptions();
    const [utility, setUtility] = useState<UtilityChoice>('both');
    const [district, setDistrict] = useState<string | null>(null);
    const [locationId, setLocationId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const areaOptions = useMemo(() => sectorOptions(district), [sectorOptions, district]);
    const selectedLocation = locations.find((location) => location.id === locationId);

    async function submit() {
        if (!locationId) return;
        const targets = utilities.filter((item) => utility === 'both' || utilityKind(item) === utility);
        if (!targets.length) {
            setSubmitError('This utility is not available right now.');
            return;
        }

        setBusy(true);
        setSubmitError(null);
        let created = 0;
        let alreadyFollowing = 0;
        try {
            for (const target of targets) {
                try {
                    await api.createSubscription(locationId, target.id);
                    created += 1;
                } catch (err) {
                    if (err instanceof ApiError && err.status === 409) alreadyFollowing += 1;
                    else throw err;
                }
            }
            const place = selectedLocation?.sector ?? `the whole of ${selectedLocation?.district ?? district}`;
            setDone(
                created
                    ? `You'll get ${utility === 'both' ? 'electricity and water' : utility} alerts for ${place}.`
                    : `You already follow ${place}${alreadyFollowing > 1 ? ' for both utilities' : ''}.`,
            );
        } catch (err) {
            setSubmitError(errorMessage(err, 'Unable to follow this area. Please try again.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <View style={styles.screen}>
            <AppHeader title="Follow an area" subtitle="Get alerts for a district or sector" showBack onBack={() => navigation.goBack()} />

            {loading ? (
                <LoadingState rows={3} />
            ) : error ? (
                <ErrorState title="Couldn't load locations" description={error} onRetry={() => void reload()} />
            ) : (
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Card style={styles.card}>
                        <Step number={1} title="What should we alert you about?" />
                        <UtilitySelector value={utility} onChange={setUtility} allowBoth />
                    </Card>

                    <Card style={styles.card}>
                        <Step number={2} title="Where?" />
                        <SearchablePicker
                            label="District"
                            placeholder="Choose a district"
                            searchPlaceholder="Search 30 districts"
                            value={district}
                            options={districtOptions}
                            onSelect={(option) => {
                                setDistrict(option.value);
                                setLocationId(sectorOptions(option.value)[0]?.value ?? null);
                            }}
                        />
                        <SearchablePicker
                            label="Sector"
                            placeholder={district ? 'Choose a sector' : 'Choose a district first'}
                            searchPlaceholder="Search sectors"
                            value={locationId}
                            options={areaOptions}
                            onSelect={(option) => setLocationId(option.value)}
                            icon="layers"
                            disabled={!district}
                        />
                        <InfoNote>
                            Pick a sector for precise alerts, or keep “Whole of {district ?? 'the district'}” to hear about every interruption in the district.
                        </InfoNote>
                    </Card>

                    {submitError ? <InfoNote tone="warning" icon="alert">{submitError}</InfoNote> : null}

                    <Button title="Start alerts" icon="bell" onPress={() => void submit()} loading={busy} disabled={!locationId} />
                </ScrollView>
            )}

            <Dialog
                visible={!!done}
                onClose={() => navigation.goBack()}
                icon="check-circle"
                tone="success"
                title="You're all set"
                message={done ?? undefined}
                actions={<Button title="Done" onPress={() => navigation.goBack()} style={styles.flex} />}
            />
        </View>
    );
}

function Step({ number, title }: { number: number; title: string }) {
    return (
        <View style={styles.step}>
            <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{number}</Text>
            </View>
            <Text style={styles.stepTitle}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 14,
    },
    card: {
        gap: 14,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stepNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    flex: {
        flex: 1,
    },
});

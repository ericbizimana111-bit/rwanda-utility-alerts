import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { TabScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { SearchablePicker } from '../components/SearchablePicker';
import { UtilityChoice, UtilitySelector } from '../components/UtilitySelector';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Dialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { Button, Card, InfoNote, SegmentedControl, StatusPill, TextField, UtilityIcon } from '../components/ui';
import { api, errorMessage, Report } from '../api/client';
import { useLocationOptions } from '../hooks/useLocationOptions';
import { formatDateTime } from '../utils/format';
import { locationLabel, utilityKind } from '../utils/outage';

type Tab = 'submit' | 'mine';
const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;

const REPORT_STATUS: Record<string, { label: string; color: string; bg: string; help: string }> = {
    pending: { label: 'Under review', color: colors.warning, bg: colors.warningBg, help: 'Waiting to be reviewed. You can still edit it.' },
    verified: { label: 'Confirmed', color: colors.primary, bg: colors.primaryLight, help: 'Our team confirmed this report.' },
    rejected: { label: 'Not confirmed', color: colors.textSecondary, bg: colors.surfaceSubtle, help: 'This report could not be confirmed.' },
    resolved: { label: 'Resolved', color: colors.success, bg: colors.successBg, help: 'The problem has been resolved.' },
};

export function ReportCreateScreen({ route }: TabScreenProps<'Reports'>) {
    const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'submit');

    useEffect(() => {
        if (route.params?.tab) setTab(route.params.tab);
    }, [route.params?.tab]);

    return (
        <View style={styles.screen}>
            <AppHeader title="Report a problem" subtitle="Tell us about an unannounced interruption">
                <SegmentedControl
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'submit', label: 'New report' },
                        { value: 'mine', label: 'My reports' },
                    ]}
                    style={styles.segmented}
                />
            </AppHeader>
            {tab === 'submit' ? <SubmitReport onSubmitted={() => setTab('mine')} /> : <MyReports onCreate={() => setTab('submit')} />}
        </View>
    );
}

function SubmitReport({ onSubmitted }: { onSubmitted: () => void }) {
    const { utilities, districtOptions, sectorOptions, loading, error, reload } = useLocationOptions();
    const [utility, setUtility] = useState<UtilityChoice | null>(null);
    const [district, setDistrict] = useState<string | null>(null);
    const [locationId, setLocationId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const areaOptions = useMemo(() => sectorOptions(district), [sectorOptions, district]);
    const length = description.trim().length;

    async function submit() {
        setFormError(null);
        const target = utilities.find((item) => utilityKind(item) === utility);
        if (!target) return setFormError('Choose electricity or water.');
        if (!locationId) return setFormError('Choose the district and sector where the problem is.');
        if (length < MIN_LENGTH) return setFormError(`Describe the problem in at least ${MIN_LENGTH} characters.`);

        setBusy(true);
        try {
            await api.createReport(locationId, target.id, description.trim());
            setDescription('');
            setSuccess(true);
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to send your report. Please try again.'));
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <LoadingState rows={3} />;
    if (error) return <ErrorState title="Couldn't load the form" description={error} onRetry={() => void reload()} />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <InfoNote icon="alert" tone="warning">
                    For danger to life, such as a fallen power line, call 112 immediately. Faults can also be reported to REG on 2727 or WASAC on 3535 (toll-free).
                </InfoNote>

                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>What is affected?</Text>
                    <UtilitySelector value={utility} onChange={setUtility} />
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Where?</Text>
                    <SearchablePicker
                        label="District"
                        placeholder="Choose a district"
                        searchPlaceholder="Search 30 districts"
                        value={district}
                        options={districtOptions}
                        onSelect={(option) => {
                            setDistrict(option.value);
                            setLocationId(null);
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
                </Card>

                <Card style={styles.card}>
                    <TextField
                        label="What's happening?"
                        placeholder="e.g. No electricity on KN 5 Rd since 7:00 this morning. Neighbours are also affected."
                        multiline
                        maxLength={MAX_LENGTH}
                        value={description}
                        onChangeText={(value) => {
                            setDescription(value);
                            if (formError) setFormError(null);
                        }}
                        hint={`${length}/${MAX_LENGTH} · Include when it started, the street or landmark, and whether neighbours are affected.`}
                    />
                </Card>

                {formError ? <InfoNote tone="warning" icon="alert">{formError}</InfoNote> : null}

                <Button title="Send report" icon="arrow-right" onPress={() => void submit()} loading={busy} />
            </ScrollView>

            <Dialog
                visible={success}
                onClose={() => setSuccess(false)}
                icon="check-circle"
                tone="success"
                title="Report sent"
                message="Thank you. Your report has been received and will be reviewed. You can follow its status under My reports."
                actions={
                    <Button
                        title="View my reports"
                        onPress={() => {
                            setSuccess(false);
                            onSubmitted();
                        }}
                        style={styles.flex}
                    />
                }
            />
        </KeyboardAvoidingView>
    );
}

function MyReports({ onCreate }: { onCreate: () => void }) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Report | null>(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const load = useCallback(async (mode: 'initial' | 'refresh') => {
        if (mode === 'initial') setLoading(true);
        else setRefreshing(true);
        try {
            setReports(await api.getReports());
            setError(null);
        } catch (err) {
            setError(errorMessage(err, 'Unable to load your reports.'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void load('initial');
    }, [load]);

    async function save() {
        if (!editing) return;
        if (draft.trim().length < MIN_LENGTH) {
            setEditError(`Use at least ${MIN_LENGTH} characters.`);
            return;
        }
        setSaving(true);
        setEditError(null);
        try {
            const updated = await api.updateReport(editing.id, draft.trim());
            setReports((current) => current.map((report) => (report.id === updated.id ? { ...report, ...updated } : report)));
            setEditing(null);
        } catch (err) {
            setEditError(errorMessage(err, 'Unable to update this report.'));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <LoadingState rows={3} />;
    if (error) return <ErrorState title="Couldn't load your reports" description={error} onRetry={() => void load('initial')} />;

    return (
        <>
            <FlatList
                data={reports}
                keyExtractor={(item) => item.id}
                contentContainerStyle={reports.length ? styles.list : styles.emptyList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} tintColor={colors.primary} colors={[colors.primary]} />}
                renderItem={({ item }) => {
                    const status = REPORT_STATUS[item.status] ?? REPORT_STATUS.pending;
                    const kind = utilityKind(item.utility);
                    return (
                        <Card style={styles.reportCard}>
                            <View style={styles.reportHeader}>
                                <UtilityIcon kind={kind} size={40} />
                                <View style={styles.flex}>
                                    <Text style={styles.reportTitle}>{kind === 'water' ? 'Water' : 'Electricity'} problem</Text>
                                    <Text style={styles.reportPlace} numberOfLines={1}>{locationLabel(item.location)}</Text>
                                </View>
                                <StatusPill label={status.label} color={status.color} bg={status.bg} />
                            </View>
                            <Text style={styles.reportBody}>{item.description}</Text>
                            <View style={styles.reportFooter}>
                                <View style={styles.reportMeta}>
                                    <Icon name="clock" size={12} color={colors.textMuted} />
                                    <Text style={styles.reportTime}>{formatDateTime(item.createdAt) ?? ''}</Text>
                                </View>
                                {item.status === 'pending' ? (
                                    <Button
                                        title="Edit"
                                        icon="edit"
                                        variant="secondary"
                                        size="md"
                                        onPress={() => {
                                            setEditing(item);
                                            setDraft(item.description);
                                            setEditError(null);
                                        }}
                                        style={styles.editButton}
                                    />
                                ) : null}
                            </View>
                            <Text style={styles.statusHelp}>{status.help}</Text>
                        </Card>
                    );
                }}
                ListEmptyComponent={
                    <EmptyState
                        icon="message"
                        title="No reports yet"
                        description="If your power or water goes off without an announcement, let us know."
                        buttonTitle="Report a problem"
                        onButtonPress={onCreate}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            <Dialog
                visible={!!editing}
                onClose={() => setEditing(null)}
                icon="edit"
                title="Edit report"
                message="Reports can be edited while they are under review."
                dismissable={!saving}
                actions={
                    <>
                        <Button title="Cancel" variant="ghost" size="md" onPress={() => setEditing(null)} disabled={saving} style={styles.flex} />
                        <Button title="Save" size="md" onPress={() => void save()} loading={saving} style={styles.flex} />
                    </>
                }
            >
                <TextField label="Description" multiline maxLength={MAX_LENGTH} value={draft} onChangeText={setDraft} error={editError} editable={!saving} />
            </Dialog>
        </>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
    },
    segmented: {
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 14,
    },
    card: {
        gap: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    list: {
        padding: 16,
        paddingBottom: 32,
        gap: 12,
    },
    emptyList: {
        flexGrow: 1,
    },
    reportCard: {
        gap: 10,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reportTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    reportPlace: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    reportBody: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    reportFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    reportMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    reportTime: {
        fontSize: 12,
        color: colors.textMuted,
    },
    editButton: {
        height: 34,
    },
    statusHelp: {
        fontSize: 12,
        color: colors.textMuted,
    },
});

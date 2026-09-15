import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { CustomDropdown, DropdownOption } from '../components/CustomDropdown';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { api, ApiError, Report, Location, Utility } from '../api/client';
import { formatDateTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;
type TabType = 'submit' | 'myReports';

function statusBadge(status: string | undefined): { label: string; bg: string; color: string } {
    const value = (status || 'pending').toLowerCase();
    if (value.includes('resolved')) return { label: 'Resolved', bg: colors.alertGreenBg, color: colors.activeGreen };
    if (value.includes('verified')) return { label: 'Verified', bg: colors.alertBlueBg, color: colors.primary };
    if (value.includes('reject')) return { label: 'Declined', bg: colors.alertRedBg, color: colors.alertRed };
    if (value.includes('progress')) return { label: 'In Progress', bg: colors.alertYellowBg, color: colors.alertYellow };
    return { label: 'In Review', bg: colors.alertYellowBg, color: colors.alertYellow };
}

export function ReportCreateScreen({ navigation }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('submit');
    const [utility, setUtility] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successModal, setSuccessModal] = useState(false);
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [reportsError, setReportsError] = useState<string | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const [editingReport, setEditingReport] = useState<Report | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    async function fetchOptions() {
        setLoadingOptions(true);
        setOptionsError(null);
        try {
            const [locs, utils] = await Promise.all([api.getLocations(), api.getUtilities()]);
            setLocations(locs);
            setUtilities(utils);
        } catch (err) {
            setOptionsError(
                err instanceof ApiError ? err.message : 'Unable to load locations and utilities.'
            );
        } finally {
            setLoadingOptions(false);
        }
    }

    useEffect(() => {
        void fetchOptions();
    }, []);

    const loadReports = useCallback(async () => {
        setLoadingReports(true);
        setReportsError(null);
        try {
            const data = await api.getReports();
            setReports(data);
        } catch (err) {
            setReportsError(
                err instanceof ApiError ? err.message : 'Unable to load your reports.'
            );
        } finally {
            setLoadingReports(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'myReports') {
            void loadReports();
        }
    }, [activeTab, loadReports]);

    // Real utilities from the backend only.
    const utilityOptions: DropdownOption[] = utilities
        .filter((u) => u.isActive)
        .map((u) => ({ label: `${u.name} (${u.code})`, value: u.id }));

    // Real locations from the backend only.
    const locationOptions: DropdownOption[] = locations.map((l) => ({
        label: [l.district, l.sector, l.cell].filter(Boolean).join(' - '),
        value: l.id,
    }));

    async function handleSubmit() {
        if (!description.trim() || description.trim().length < 10) {
            setErrorMsg('Please describe the issue with at least 10 characters.');
            return;
        }
        if (!location || !utility) {
            setErrorMsg('Please select both a location and a utility.');
            return;
        }

        setBusy(true);
        setErrorMsg(null);
        try {
            await api.createReport(location, utility, description.trim());
            setDescription('');
            setSuccessModal(true);
        } catch (err) {
            setErrorMsg(
                err instanceof ApiError
                    ? err.message
                    : 'Unable to submit report. Please check your network connection.'
            );
        } finally {
            setBusy(false);
        }
    }

    function startEdit(report: Report) {
        setEditingReport(report);
        setEditDescription(report.description);
        setEditError(null);
    }

    async function saveEdit() {
        if (!editingReport) return;
        if (editDescription.trim().length < 10) {
            setEditError('Description must be at least 10 characters.');
            return;
        }
        setSavingEdit(true);
        setEditError(null);
        try {
            const updated = await api.updateReport(editingReport.id, editDescription.trim());
            setReports((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
            setEditingReport(null);
        } catch (err) {
            setEditError(
                err instanceof ApiError ? err.message : 'Unable to update this report.'
            );
        } finally {
            setSavingEdit(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Community Reports"
                showBack
                onBack={() => navigation.navigate('Home')}
            />

            <View style={styles.container}>
                {/* Tabs: Submit Report / My Reports */}
                <View style={styles.tabBar}>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'submit' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('submit')}
                    >
                        <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>
                            Submit Report
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.tabButton, activeTab === 'myReports' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('myReports')}
                    >
                        <Text style={[styles.tabText, activeTab === 'myReports' && styles.tabTextActive]}>
                            My Reports ({reports.length})
                        </Text>
                    </Pressable>
                </View>

                {activeTab === 'submit' ? (
                    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                        {loadingOptions ? (
                            <View style={styles.optionsLoader}>
                                <ActivityIndicator color={colors.primary} />
                                <Text style={styles.optionsLoaderText}>Loading locations and utilities...</Text>
                            </View>
                        ) : optionsError ? (
                            <View style={styles.optionsErrorBox}>
                                <Text style={styles.errorText}>{optionsError}</Text>
                                <Pressable style={styles.retryBtn} onPress={() => void fetchOptions()}>
                                    <Text style={styles.retryBtnText}>Retry</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                {/* Utility Dropdown */}
                                <CustomDropdown
                                    label="Utility"
                                    placeholder="Select utility"
                                    value={utility}
                                    options={utilityOptions}
                                    onSelect={(opt) => setUtility(opt.value)}
                                />

                                {/* Location Dropdown */}
                                <CustomDropdown
                                    label="Location"
                                    placeholder="Select location"
                                    value={location}
                                    options={locationOptions}
                                    onSelect={(opt) => setLocation(opt.value)}
                                />

                                {/* Description Textarea */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput
                                        style={styles.textArea}
                                        placeholder="Describe the issue..."
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        numberOfLines={5}
                                        textAlignVertical="top"
                                        value={description}
                                        onChangeText={(t) => {
                                            setDescription(t);
                                            if (errorMsg) setErrorMsg(null);
                                        }}
                                    />
                                </View>

                                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                                {/* Submit Button */}
                                <Pressable
                                    style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
                                    onPress={handleSubmit}
                                    disabled={busy}
                                >
                                    {busy ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Submit Report</Text>
                                    )}
                                </Pressable>
                            </>
                        )}
                    </ScrollView>
                ) : (
                    /* My Reports Tab */
                    <View style={styles.myReportsContent}>
                        {loadingReports ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : reportsError ? (
                            <View style={styles.reportsErrorBox}>
                                <Text style={styles.errorText}>{reportsError}</Text>
                                <Pressable style={styles.retryBtn} onPress={() => void loadReports()}>
                                    <Text style={styles.retryBtnText}>Retry</Text>
                                </Pressable>
                            </View>
                        ) : reports.length === 0 ? (
                            <EmptyState
                                title="No reports yet"
                                description="Your submitted reports will appear here."
                                buttonTitle="Create a Report"
                                onButtonPress={() => setActiveTab('submit')}
                            />
                        ) : (
                            <ScrollView contentContainerStyle={styles.reportsList}>
                                {reports.map((rep) => {
                                    const badge = statusBadge(rep.status);

                                    return (
                                        <View key={rep.id} style={styles.reportCard}>
                                            <View style={styles.reportHeader}>
                                                <Text style={styles.reportTitle}>
                                                    {rep.utility?.name || 'Utility'} Outage
                                                </Text>
                                                <View style={[styles.reportBadge, { backgroundColor: badge.bg }]}>
                                                    <Text style={[styles.reportBadgeText, { color: badge.color }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.reportDesc}>{rep.description}</Text>
                                            <View style={styles.reportFooter}>
                                                <Text style={styles.reportLoc}>
                                                    {rep.location?.district || 'Location'}
                                                    {rep.location?.sector ? ' · ' + rep.location.sector : ''}
                                                </Text>
                                                <Text style={styles.reportTime}>
                                                    {formatDateTime(rep.createdAt) ?? ''}
                                                </Text>
                                            </View>
                                            {rep.status?.toLowerCase() === 'pending' ? (
                                                <Pressable
                                                    style={styles.editBtn}
                                                    onPress={() => startEdit(rep)}
                                                >
                                                    <Icon name="document" size={14} color={colors.primary} />
                                                    <Text style={styles.editBtnText}>Edit</Text>
                                                </Pressable>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>

            {/* Success Submission Modal (only after the API call succeeded) */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconCircle}>
                            <Icon name="check" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.successTitle}>Report Submitted!</Text>
                        <Text style={styles.successDesc}>
                            Your outage report has been received and routed to regional utility responders.
                        </Text>
                        <Pressable
                            style={styles.doneBtn}
                            onPress={() => {
                                setSuccessModal(false);
                                setActiveTab('myReports');
                            }}
                        >
                            <Text style={styles.doneBtnText}>View My Reports</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Edit Report Modal (PATCH /reports/:id, pending reports only) */}
            <Modal visible={!!editingReport} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.editCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Report</Text>
                            <Pressable onPress={() => setEditingReport(null)} hitSlop={10} disabled={savingEdit}>
                                <Icon name="close" size={20} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                        <TextInput
                            style={styles.editTextArea}
                            placeholder="Describe the issue..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={editDescription}
                            onChangeText={setEditDescription}
                            editable={!savingEdit}
                        />
                        {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
                        <View style={styles.editActionsRow}>
                            <Pressable style={styles.cancelBtn} onPress={() => setEditingReport(null)} disabled={savingEdit}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.saveBtn} onPress={() => void saveEdit()} disabled={savingEdit}>
                                {savingEdit ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <BottomNavigation
                activeTab="Reports"
                onTabPress={(tab) => {
                    if (tab === 'Home') navigation.navigate('Home');
                    else if (tab === 'Outages') navigation.navigate('Outages');
                    else if (tab === 'Subscriptions') navigation.navigate('Subscriptions');
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
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 14,
    },
    optionsLoader: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 24,
    },
    optionsLoaderText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    optionsErrorBox: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 20,
    },
    reportsErrorBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
    },
    retryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    textArea: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 8,
        padding: 14,
        height: 110,
        fontSize: 14,
        color: colors.textPrimary,
    },
    errorText: {
        color: colors.alertRed,
        fontSize: 13,
        textAlign: 'center',
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    btnPressed: {
        opacity: 0.9,
    },
    myReportsContent: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportsList: {
        padding: 16,
        gap: 12,
    },
    reportCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reportTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    reportDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    reportFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    reportLoc: {
        fontSize: 12,
        color: colors.textSecondary,
        flex: 1,
    },
    reportTime: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'right',
    },
    reportBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    reportBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 4,
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    successCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    successIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.activeGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    successTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    doneBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    editCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        gap: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    editTextArea: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 8,
        padding: 12,
        height: 100,
        fontSize: 14,
        color: colors.textPrimary,
    },
    editActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.borderDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 11,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

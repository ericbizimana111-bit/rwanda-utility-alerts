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
import { api, Report, Location, Utility } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;
type TabType = 'submit' | 'myReports';

export function ReportCreateScreen({ navigation }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('submit');
    const [utility, setUtility] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [hasPhoto, setHasPhoto] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successModal, setSuccessModal] = useState(false);
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const [locs, utils] = await Promise.all([api.getLocations(), api.getUtilities()]);
                setLocations(locs);
                setUtilities(utils);
            } catch {
                // Handled
            }
        }
        void fetchOptions();
    }, []);

    const loadReports = useCallback(async () => {
        setLoadingReports(true);
        try {
            const data = await api.getReports();
            setReports(data);
        } catch {
            // Handled
        } finally {
            setLoadingReports(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'myReports') {
            void loadReports();
        }
    }, [activeTab, loadReports]);

    const utilityOptions: DropdownOption[] = utilities.map((u) => ({
        label: `${u.name} (${u.code})`,
        value: u.id,
    }));
    if (utilityOptions.length === 0) {
        utilityOptions.push(
            { label: 'Electricity (REG)', value: 'util-reg-1' },
            { label: 'Water (WASAC)', value: 'util-wasac-2' }
        );
    }

    const locationOptions: DropdownOption[] = locations.map((l) => ({
        label: `${l.district}${l.sector ? ' - ' + l.sector : ''}${l.cell ? ' (' + l.cell + ')' : ''}`,
        value: l.id,
    }));
    if (locationOptions.length === 0) {
        locationOptions.push(
            { label: 'Kigali City - Gasabo - Kimironko', value: 'loc-gasabo-1' },
            { label: 'Kigali City - Nyarugenge - Nyamirambo', value: 'loc-nyarugenge-1' },
            { label: 'Kigali City - Kicukiro - Niboye', value: 'loc-kicukiro-1' },
            { label: 'Eastern - Rwamagana - Kigabiro', value: 'loc-rwamagana-1' },
            { label: 'Southern - Muhanga - Nyamabuye', value: 'loc-muhanga-1' }
        );
    }

    async function handleSubmit() {
        if (!description.trim()) {
            setErrorMsg('Please enter a description for the outage report.');
            return;
        }

        setBusy(true);
        setErrorMsg(null);
        try {
            await api.createReport(
                location || locationOptions[0]?.value || 'loc-gasabo-1',
                utility || utilityOptions[0]?.value || 'util-reg-1',
                description.trim()
            );
            setDescription('');
            setHasPhoto(false);
            setSuccessModal(true);
        } catch {
            setErrorMsg('Unable to submit report. Please check your network connection.');
        } finally {
            setBusy(false);
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

                        {/* Add Photo Button */}
                        <Pressable
                            style={styles.addPhotoBtn}
                            onPress={() => setHasPhoto(!hasPhoto)}
                        >
                            <Icon name="camera" size={18} color={colors.primary} />
                            <Text style={styles.addPhotoText}>
                                {hasPhoto ? 'Photo Attached (Tap to remove)' : 'Add Photo (optional)'}
                            </Text>
                        </Pressable>

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
                    </ScrollView>
                ) : (
                    /* My Reports Tab */
                    <View style={styles.myReportsContent}>
                        {loadingReports ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
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
                                    const statusLower = rep.status?.toLowerCase() || 'pending';
                                    let badgeBg = colors.alertYellowBg;
                                    let badgeColor = colors.alertYellow;
                                    let statusLabel = 'In Review';

                                    if (statusLower.includes('resolved')) {
                                        badgeBg = colors.alertGreenBg;
                                        badgeColor = colors.activeGreen;
                                        statusLabel = 'Resolved';
                                    } else if (statusLower.includes('verified')) {
                                        badgeBg = colors.alertBlueBg;
                                        badgeColor = colors.primary;
                                        statusLabel = 'Verified';
                                    } else if (statusLower.includes('reject')) {
                                        badgeBg = colors.alertRedBg;
                                        badgeColor = colors.alertRed;
                                        statusLabel = 'Declined';
                                    }

                                    return (
                                        <View key={rep.id} style={styles.reportCard}>
                                            <View style={styles.reportHeader}>
                                                <Text style={styles.reportTitle}>
                                                    {rep.utility?.name || 'Utility'} Outage
                                                </Text>
                                                <View style={[styles.reportBadge, { backgroundColor: badgeBg }]}>
                                                    <Text style={[styles.reportBadgeText, { color: badgeColor }]}>
                                                        {statusLabel}
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
                                                    {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : 'Recent'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>

            {/* Success Submission Modal */}
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
    addPhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 8,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        marginTop: 4,
    },
    addPhotoText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
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
    },
    reportTime: {
        fontSize: 11,
        color: colors.textMuted,
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
});

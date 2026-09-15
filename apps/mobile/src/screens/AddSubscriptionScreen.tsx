import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import { CustomDropdown, DropdownOption } from '../components/CustomDropdown';
import { Icon } from '../components/Icon';
import { api, ApiError, Location, Utility } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'AddSubscription'>;

export function AddSubscriptionScreen({ navigation }: Props) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [utilityId, setUtilityId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function fetchOptions() {
        setLoadingOptions(true);
        setOptionsError(null);
        try {
            const [locs, utils] = await Promise.all([
                api.getLocations(),
                api.getUtilities(),
            ]);
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

    // Real locations from the backend only. The submit button stays disabled
    // until a real location record is selected.
    const locationOptions: DropdownOption[] = locations.map((l) => ({
        label: [l.district, l.sector, l.cell].filter(Boolean).join(' - '),
        value: l.id,
    }));

    // Real utilities from the backend only.
    const utilityOptions: DropdownOption[] = utilities
        .filter((u) => u.isActive)
        .map((u) => ({ label: `${u.name} (${u.code})`, value: u.id }));

    async function handleSubscribe() {
        if (!location || !utilityId) {
            setErrorMsg('Please select both a location and a utility.');
            return;
        }

        setBusy(true);
        setErrorMsg(null);
        try {
            await api.createSubscription(location, utilityId);
            setSuccessModal(true);
        } catch (err) {
            setErrorMsg(
                err instanceof ApiError
                    ? err.message
                    : 'Unable to add subscription. Please verify your connection.'
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Add Subscription"
                showBack
                onBack={() => navigation.goBack()}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
                        {/* Location Dropdown (real backend locations) */}
                        <CustomDropdown
                            label="Location"
                            placeholder="Select location"
                            value={location}
                            options={locationOptions}
                            onSelect={(opt) => setLocation(opt.value)}
                        />

                        {/* Utility Dropdown (real backend utilities) */}
                        <CustomDropdown
                            label="Utility"
                            placeholder="Select utility"
                            value={utilityId}
                            options={utilityOptions}
                            onSelect={(opt) => setUtilityId(opt.value)}
                        />

                        {locationOptions.length === 0 || utilityOptions.length === 0 ? (
                            <Text style={styles.emptyOptionsText}>
                                No locations or utilities are available right now. Please try again later.
                            </Text>
                        ) : null}

                        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                        {/* Subscribe Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.submitBtn,
                                (!location || !utilityId || busy) && styles.submitBtnDisabled,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={handleSubscribe}
                            disabled={!location || !utilityId || busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Subscribe</Text>
                            )}
                        </Pressable>
                    </>
                )}
            </ScrollView>

            {/* Success Modal (shown only after the API call succeeded) */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconCircle}>
                            <Icon name="check" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.successTitle}>Subscribed!</Text>
                        <Text style={styles.successDesc}>
                            You will now receive outage notifications for this neighborhood.
                        </Text>
                        <Pressable
                            style={styles.doneBtn}
                            onPress={() => {
                                setSuccessModal(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.doneBtnText}>View Subscriptions</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    scrollContent: {
        padding: 20,
        gap: 14,
    },
    optionsLoader: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 32,
    },
    optionsLoaderText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    optionsErrorBox: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 24,
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
    emptyOptionsText: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    btnPressed: {
        opacity: 0.9,
    },
    errorText: {
        color: colors.alertRed,
        fontSize: 13,
        textAlign: 'center',
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

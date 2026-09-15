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
import { api, Location, Utility } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'AddSubscription'>;

export function AddSubscriptionScreen({ navigation }: Props) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [district, setDistrict] = useState<string | null>(null);
    const [sector, setSector] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [utilityType, setUtilityType] = useState<'electricity' | 'water'>('electricity');
    const [busy, setBusy] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const [locs, utils] = await Promise.all([
                    api.getLocations(),
                    api.getUtilities(),
                ]);
                setLocations(locs);
                setUtilities(utils);
            } catch {
                // Handled
            }
        }
        void fetchOptions();
    }, []);

    // District options from locations or defaults
    const districtList = Array.from(new Set(locations.map((l) => l.district).filter(Boolean)));
    const districtOptions: DropdownOption[] = (
        districtList.length > 0
            ? districtList
            : ['Gasabo District', 'Nyarugenge District', 'Kicukiro District', 'Rwamagana District', 'Muhanga District', 'Musanze District', 'Rubavu District']
    ).map((d) => ({ label: d, value: d }));

    // Sector options filtered by district
    const sectorList = Array.from(
        new Set(
            locations
                .filter((l) => !district || l.district === district)
                .map((l) => l.sector)
                .filter(Boolean) as string[]
        )
    );
    const sectorOptions: DropdownOption[] = (
        sectorList.length > 0
            ? sectorList
            : ['Kimironko', 'Kacyiru', 'Gisozi', 'Nyamirambo', 'Niboye', 'Gatenga', 'Muhoza']
    ).map((s) => ({ label: s, value: s }));

    // Location options
    const locationOptions: DropdownOption[] = locations.map((l) => ({
        label: `${l.district}${l.sector ? ' - ' + l.sector : ''}${l.cell ? ' (' + l.cell + ')' : ''}`,
        value: l.id,
    }));

    if (locationOptions.length === 0) {
        locationOptions.push(
            { label: 'Kimironko Sector - Kibagabaga Cell', value: 'loc-gasabo-1' },
            { label: 'Nyamirambo - Rwezamenyo', value: 'loc-nyarugenge-1' },
            { label: 'Niboye - Gatenga Center', value: 'loc-kicukiro-1' },
            { label: 'Kacyiru - Golf Course Zone', value: 'loc-gasabo-kacyiru' }
        );
    }

    async function handleSubscribe() {
        setBusy(true);
        setErrorMsg(null);
        try {
            // Find matched location
            const chosenLoc = locations.find((l) => l.id === location) || locations[0];
            const targetUtility = utilities.find((u) =>
                utilityType === 'water'
                    ? u.name.toLowerCase().includes('water')
                    : u.name.toLowerCase().includes('electric')
            ) || utilities[0];

            await api.createSubscription(
                chosenLoc?.id || 'loc-gasabo-1',
                targetUtility?.id || (utilityType === 'water' ? 'util-wasac-2' : 'util-reg-1')
            );
            setSuccessModal(true);
        } catch {
            setErrorMsg('Unable to add subscription. Please verify your connection.');
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
                {/* District Dropdown */}
                <CustomDropdown
                    label="District"
                    placeholder="Select district"
                    value={district}
                    options={districtOptions}
                    onSelect={(opt) => {
                        setDistrict(opt.value);
                        setSector(null);
                    }}
                />

                {/* Sector Dropdown */}
                <CustomDropdown
                    label="Sector"
                    placeholder="Select sector"
                    value={sector}
                    options={sectorOptions}
                    onSelect={(opt) => setSector(opt.value)}
                />

                {/* Location Dropdown */}
                <CustomDropdown
                    label="Location"
                    placeholder="Select location"
                    value={location}
                    options={locationOptions}
                    onSelect={(opt) => setLocation(opt.value)}
                />

                {/* Utility Radio Cards */}
                <View style={styles.utilitySection}>
                    <Text style={styles.sectionLabel}>Utility</Text>

                    {/* Electricity Card */}
                    <Pressable
                        style={[
                            styles.utilityCard,
                            utilityType === 'electricity' && styles.utilityCardSelected,
                        ]}
                        onPress={() => setUtilityType('electricity')}
                    >
                        <View style={styles.utilityCardLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.electricityBg }]}>
                                <Icon name="lightning" size={20} color={colors.electricityIcon} />
                            </View>
                            <Text style={styles.utilityName}>Electricity</Text>
                        </View>

                        <View style={styles.radioOuter}>
                            {utilityType === 'electricity' && <View style={styles.radioInner} />}
                        </View>
                    </Pressable>

                    {/* Water Card */}
                    <Pressable
                        style={[
                            styles.utilityCard,
                            utilityType === 'water' && styles.utilityCardSelected,
                        ]}
                        onPress={() => setUtilityType('water')}
                    >
                        <View style={styles.utilityCardLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.waterBg }]}>
                                <Icon name="water" size={20} color={colors.water} />
                            </View>
                            <Text style={styles.utilityName}>Water</Text>
                        </View>

                        <View style={styles.radioOuter}>
                            {utilityType === 'water' && <View style={styles.radioInner} />}
                        </View>
                    </Pressable>
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                {/* Subscribe Button */}
                <Pressable
                    style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
                    onPress={handleSubscribe}
                    disabled={busy}
                >
                    {busy ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Subscribe</Text>
                    )}
                </Pressable>
            </ScrollView>

            {/* Success Modal */}
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
    utilitySection: {
        marginTop: 6,
        gap: 12,
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    utilityCard: {
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderDark,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    utilityCardSelected: {
        borderColor: colors.primary,
        backgroundColor: '#FFFFFF',
    },
    utilityCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    utilityName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
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

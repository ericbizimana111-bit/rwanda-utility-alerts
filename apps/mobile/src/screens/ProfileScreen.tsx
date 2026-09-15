import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { Icon, IconName } from '../components/Icon';
import { useAuthStore } from '../auth/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

interface MenuItem {
    id: string;
    title: string;
    icon: IconName;
    action: () => void;
}

export function ProfileScreen({ navigation }: Props) {
    const user = useAuthStore((state) => state.user);
    const signOut = useAuthStore((state) => state.signOut);
    const pushStatus = useAuthStore((state) => state.pushStatus);

    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [settingsModal, setSettingsModal] = useState(false);
    const [aboutModal, setAboutModal] = useState(false);
    const [helpModal, setHelpModal] = useState(false);

    const menuItems: MenuItem[] = [
        {
            id: 'subs',
            title: 'My Subscriptions',
            icon: 'subscriptions',
            action: () => navigation.navigate('Subscriptions'),
        },
        {
            id: 'reports',
            title: 'My Reports',
            icon: 'document',
            action: () => navigation.navigate('Reports'),
        },
        {
            id: 'notif',
            title: 'Notification Settings',
            icon: 'bell',
            action: () => setSettingsModal(true),
        },
        {
            id: 'device',
            title: 'Device & Push Settings',
            icon: 'device',
            action: () => navigation.navigate('DeviceRegistration'),
        },
        {
            id: 'help',
            title: 'Help & Support',
            icon: 'help',
            action: () => setHelpModal(true),
        },
        {
            id: 'about',
            title: 'About Rwanda Utility Alerts',
            icon: 'info',
            action: () => setAboutModal(true),
        },
    ];

    async function confirmLogout() {
        setLoggingOut(true);
        try {
            await signOut();
            setLogoutModalVisible(false);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setLoggingOut(false);
        }
    }

    const initial = (user?.firstName || 'U').charAt(0).toUpperCase();
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Resident';

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader title="Profile" />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Customer Account Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLetter}>{initial}</Text>
                    </View>
                    <Text style={styles.userName}>{fullName}</Text>
                    <Text style={styles.userPhone}>{user?.phone || 'No phone registered'}</Text>
                    {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
                    {user?.role ? (
                        <View style={styles.residentBadge}>
                            <Text style={styles.residentText}>
                                {user.role === 'ADMIN' ? 'Administrator' : 'Resident Account'}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Customer Menu List */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <Pressable
                            key={item.id}
                            style={({ pressed }) => [
                                styles.menuRow,
                                index === menuItems.length - 1 && styles.lastMenuRow,
                                pressed && styles.rowPressed,
                            ]}
                            onPress={item.action}
                        >
                            <View style={styles.menuLeft}>
                                <Icon name={item.icon} size={20} color={colors.textSecondary} />
                                <Text style={styles.menuTitle}>{item.title}</Text>
                            </View>
                            <Icon name="chevron-right" size={18} color={colors.textMuted} />
                        </Pressable>
                    ))}
                </View>

                {/* Logout Button */}
                <Pressable
                    style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutPressed]}
                    onPress={() => setLogoutModalVisible(true)}
                >
                    <Icon name="logout" size={18} color={colors.logoutRed} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <Modal visible={logoutModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmCard}>
                        <View style={styles.logoutIconCircle}>
                            <Icon name="logout" size={26} color={colors.logoutRed} />
                        </View>
                        <Text style={styles.confirmTitle}>Confirm Logout</Text>
                        <Text style={styles.confirmDesc}>
                            Are you sure you want to log out of your Rwanda Utility Alerts account?
                        </Text>
                        <View style={styles.confirmButtonsRow}>
                            <Pressable
                                style={styles.cancelBtn}
                                onPress={() => setLogoutModalVisible(false)}
                                disabled={loggingOut}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.confirmLogoutBtn}
                                onPress={() => void confirmLogout()}
                                disabled={loggingOut}
                            >
                                {loggingOut ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.confirmLogoutBtnText}>Log Out</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Notification Settings Modal */}
            <Modal visible={settingsModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notification Settings</Text>
                            <Pressable onPress={() => setSettingsModal(false)} hitSlop={10}>
                                <Icon name="close" size={20} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Push Notifications</Text>
                            <Text style={styles.settingValue}>
                                {pushStatus === 'registered'
                                    ? 'Enabled on this device'
                                    : 'Not enabled on this device'}
                            </Text>
                        </View>
                        <Text style={styles.settingsHint}>
                            {user?.notificationsEnabled === false
                                ? 'Notifications are turned off for your account. Contact support to enable them.'
                                : 'You receive alerts for your subscribed locations.'}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Help & Support Modal */}
            <Modal visible={helpModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Help & Support</Text>
                            <Pressable onPress={() => setHelpModal(false)} hitSlop={10}>
                                <Icon name="close" size={20} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                        <Text style={styles.supportIntro}>
                            For emergency utility support or inquiries across Rwanda:
                        </Text>
                        <View style={styles.supportBox}>
                            <Text style={styles.supportItem}>⚡ <Text style={{ fontWeight: '700' }}>REG Electricity Support:</Text> 4444 (Toll-Free)</Text>
                            <Text style={styles.supportItem}>💧 <Text style={{ fontWeight: '700' }}>WASAC Water Support:</Text> 3535 (Toll-Free)</Text>
                            <Text style={styles.supportItem}>✉️ <Text style={{ fontWeight: '700' }}>Support Email:</Text> support@rwanda-utility.rw</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* About Modal */}
            <Modal visible={aboutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>About</Text>
                            <Pressable onPress={() => setAboutModal(false)} hitSlop={10}>
                                <Icon name="close" size={20} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                        <Text style={styles.aboutDesc}>
                            Rwanda Utility Alerts helps residents stay informed about scheduled and emergency
                            electricity and water maintenance in their neighborhoods.
                        </Text>
                        <Text style={styles.versionText}>Version 1.0.0 (Build 2026.09)</Text>
                    </View>
                </View>
            </Modal>

            <BottomNavigation
                activeTab="More"
                onTabPress={(tab) => {
                    if (tab === 'Home') navigation.navigate('Home');
                    else if (tab === 'Outages') navigation.navigate('Outages');
                    else if (tab === 'Subscriptions') navigation.navigate('Subscriptions');
                    else if (tab === 'Reports') navigation.navigate('Reports');
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
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    profileCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    avatarLarge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarLetter: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
    },
    userName: {
        fontSize: 19,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 8,
    },
    residentBadge: {
        backgroundColor: colors.activeGreenBg,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        marginTop: 4,
    },
    residentText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.activeGreen,
        letterSpacing: 0.3,
    },
    menuContainer: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    lastMenuRow: {
        borderBottomWidth: 0,
    },
    rowPressed: {
        backgroundColor: '#F8FAFC',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    logoutBtn: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.logoutBorder,
        borderRadius: 10,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
    },
    logoutPressed: {
        backgroundColor: colors.logoutBg,
    },
    logoutText: {
        color: colors.logoutRed,
        fontWeight: '700',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    confirmCard: {
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
    logoutIconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.logoutBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    confirmDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    confirmButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
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
    confirmLogoutBtn: {
        flex: 1,
        backgroundColor: colors.logoutRed,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmLogoutBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        gap: 14,
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
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingLabel: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    settingValue: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    settingsHint: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 17,
    },
    supportIntro: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    supportBox: {
        gap: 10,
        marginTop: 6,
    },
    supportItem: {
        fontSize: 13,
        color: colors.textPrimary,
        lineHeight: 20,
    },
    aboutDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    versionText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },
});

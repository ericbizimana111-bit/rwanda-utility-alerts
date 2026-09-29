import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Linking, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { TabScreenProps } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Dialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { Button, Card, InfoNote, ListRow, TextField } from '../components/ui';
import { useAuthStore } from '../auth/store';
import { api, errorMessage } from '../api/client';
import { formatPhone } from '../utils/format';
import { OFFICIAL_SOURCES, SUPPORT_CONTACTS } from '../constants/contacts';

type DialogName = 'edit' | 'password' | 'support' | 'about' | 'logout' | null;

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const signOut = useAuthStore((state) => state.signOut);
    const pushStatus = useAuthStore((state) => state.pushStatus);
    const [dialog, setDialog] = useState<DialogName>(null);
    const [savingToggle, setSavingToggle] = useState(false);
    const [toggleError, setToggleError] = useState<string | null>(null);

    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Resident';
    const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
    const version = Constants.expoConfig?.version ?? '1.0.0';

    async function toggleNotifications(enabled: boolean) {
        setSavingToggle(true);
        setToggleError(null);
        try {
            setUser(await api.updateProfile({ notificationsEnabled: enabled }));
        } catch (err) {
            setToggleError(errorMessage(err, 'Unable to update your alert setting.'));
        } finally {
            setSavingToggle(false);
        }
    }

    return (
        <View style={styles.screen}>
            <AppHeader title="Profile" subtitle="Account, alerts and help" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Card style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.profileText}>
                        <Text style={styles.name}>{fullName}</Text>
                        <Text style={styles.detail}>{formatPhone(user?.phone)}</Text>
                        {user?.email ? <Text style={styles.detail}>{user.email}</Text> : null}
                    </View>
                    <Pressable onPress={() => setDialog('edit')} hitSlop={10} style={styles.editButton} accessibilityRole="button" accessibilityLabel="Edit profile">
                        <Icon name="edit" size={17} color={colors.primary} />
                    </Pressable>
                </Card>

                <Text style={styles.groupTitle}>Alerts</Text>
                <Card style={styles.group}>
                    <ListRow
                        icon="bell"
                        title="Outage alerts"
                        subtitle={user?.notificationsEnabled === false ? 'Paused for your account' : 'On for the areas you follow'}
                        right={
                            <Switch
                                value={user?.notificationsEnabled !== false}
                                onValueChange={(value) => void toggleNotifications(value)}
                                disabled={savingToggle}
                                trackColor={{ true: colors.primary, false: colors.borderDark }}
                                thumbColor="#FFFFFF"
                            />
                        }
                    />
                    <ListRow icon="map-pin" title="My areas" subtitle="Districts and sectors you follow" onPress={() => navigation.navigate('Subscriptions')} />
                    <ListRow
                        icon="device"
                        title="This device"
                        subtitle={pushStatus === 'registered' ? 'Push notifications enabled' : 'Set up push notifications'}
                        onPress={() => navigation.navigate('DeviceRegistration')}
                        last
                    />
                </Card>
                {toggleError ? <InfoNote tone="warning" icon="alert">{toggleError}</InfoNote> : null}

                <Text style={styles.groupTitle}>Account</Text>
                <Card style={styles.group}>
                    <ListRow icon="user" title="Personal details" subtitle="Name and email" onPress={() => setDialog('edit')} />
                    <ListRow icon="key" title="Change password" onPress={() => setDialog('password')} />
                    <ListRow icon="message" title="My reports" subtitle="Problems you reported" onPress={() => navigation.navigate('Reports', { tab: 'mine' })} last />
                </Card>

                <Text style={styles.groupTitle}>Help</Text>
                <Card style={styles.group}>
                    <ListRow icon="phone" iconColor={colors.danger} iconBg={colors.dangerBg} title="Emergency & support lines" subtitle="REG 2727 · WASAC 3535 · Police 112" onPress={() => setDialog('support')} />
                    <ListRow icon="globe" title="Official REG outage list" onPress={() => void Linking.openURL(OFFICIAL_SOURCES.reg)} right={<Icon name="external" size={16} color={colors.textMuted} />} />
                    <ListRow icon="globe" title="Official WASAC announcements" onPress={() => void Linking.openURL(OFFICIAL_SOURCES.wasac)} right={<Icon name="external" size={16} color={colors.textMuted} />} />
                    <ListRow icon="info" title="About Rwanda Utility Alerts" subtitle={`Version ${version}`} onPress={() => setDialog('about')} last />
                </Card>

                <Card style={styles.group}>
                    <ListRow icon="logout" title="Log out" destructive onPress={() => setDialog('logout')} last />
                </Card>
            </ScrollView>

            <EditProfileDialog visible={dialog === 'edit'} onClose={() => setDialog(null)} />
            <ChangePasswordDialog visible={dialog === 'password'} onClose={() => setDialog(null)} />
            <SupportDialog visible={dialog === 'support'} onClose={() => setDialog(null)} />
            <Dialog
                visible={dialog === 'about'}
                onClose={() => setDialog(null)}
                icon="info"
                title="Rwanda Utility Alerts"
                message={`Version ${version}`}
                actions={<Button title="Close" variant="ghost" size="md" onPress={() => setDialog(null)} style={styles.flex} />}
            >
                <Text style={styles.aboutText}>
                    Rwanda Utility Alerts gathers planned electricity interruptions published by Rwanda Energy Group (REG) and water supply
                    notices published by WASAC Group, and alerts you for the districts and sectors you follow.
                </Text>
                <Text style={styles.aboutText}>
                    This app is independent and is not operated by REG or WASAC. Schedules can change at short notice, so always confirm with the
                    official announcement, linked on every outage.
                </Text>
            </Dialog>
            <LogoutDialog visible={dialog === 'logout'} onClose={() => setDialog(null)} onConfirm={signOut} />
        </View>
    );
}

function EditProfileDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [firstName, setFirstName] = useState(user?.firstName ?? '');
    const [lastName, setLastName] = useState(user?.lastName ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (visible) {
            setFirstName(user?.firstName ?? '');
            setLastName(user?.lastName ?? '');
            setEmail(user?.email ?? '');
            setError(null);
        }
    }, [visible, user]);

    async function save() {
        if (firstName.trim().length < 2 || lastName.trim().length < 2) {
            setError('First and last name need at least 2 characters.');
            return;
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Enter a valid email address or leave it empty.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            setUser(await api.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || null }));
            onClose();
        } catch (err) {
            setError(errorMessage(err, 'Unable to save your details.'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            icon="user"
            title="Personal details"
            message={`Signed in with ${formatPhone(user?.phone)}`}
            dismissable={!saving}
            actions={
                <>
                    <Button title="Cancel" variant="ghost" size="md" onPress={onClose} disabled={saving} style={styles.flex} />
                    <Button title="Save" size="md" onPress={() => void save()} loading={saving} style={styles.flex} />
                </>
            }
        >
            <TextField label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" />
            <TextField label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" />
            <TextField label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </Dialog>
    );
}

function ChangePasswordDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    React.useEffect(() => {
        if (visible) {
            setCurrent('');
            setNext('');
            setConfirm('');
            setError(null);
            setDone(false);
        }
    }, [visible]);

    async function save() {
        if (next.length < 6) return setError('Your new password needs at least 6 characters.');
        if (next !== confirm) return setError('The new passwords do not match.');
        setSaving(true);
        setError(null);
        try {
            await api.changePassword(current, next);
            setDone(true);
        } catch (err) {
            setError(errorMessage(err, 'Unable to change your password.'));
        } finally {
            setSaving(false);
        }
    }

    if (done) {
        return (
            <Dialog
                visible={visible}
                onClose={onClose}
                icon="check-circle"
                tone="success"
                title="Password changed"
                message="Use your new password the next time you sign in."
                actions={<Button title="Done" size="md" onPress={onClose} style={styles.flex} />}
            />
        );
    }

    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            icon="key"
            title="Change password"
            dismissable={!saving}
            actions={
                <>
                    <Button title="Cancel" variant="ghost" size="md" onPress={onClose} disabled={saving} style={styles.flex} />
                    <Button title="Update" size="md" onPress={() => void save()} loading={saving} style={styles.flex} />
                </>
            }
        >
            <TextField label="Current password" secure value={current} onChangeText={setCurrent} autoComplete="password" />
            <TextField label="New password" secure value={next} onChangeText={setNext} hint="At least 6 characters" autoComplete="new-password" />
            <TextField label="Confirm new password" secure value={confirm} onChangeText={setConfirm} autoComplete="new-password" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </Dialog>
    );
}

function SupportDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            icon="phone"
            tone="danger"
            title="Emergency & support lines"
            message="Tap a number to call. Rwanda Utility Alerts cannot fix faults; contact the utility directly."
            actions={<Button title="Close" variant="ghost" size="md" onPress={onClose} style={styles.flex} />}
        >
            {SUPPORT_CONTACTS.map((contact) => (
                <Pressable
                    key={contact.id}
                    onPress={() => contact.phone && void Linking.openURL(`tel:${contact.phone}`)}
                    style={({ pressed }) => [styles.contact, pressed && styles.contactPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${contact.name} on ${contact.phone}`}
                >
                    <View style={[styles.contactIcon, { backgroundColor: contact.bg }]}>
                        <Icon name={contact.icon} size={18} color={contact.color} />
                    </View>
                    <View style={styles.flex}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactText}>{contact.description}</Text>
                    </View>
                    <View style={styles.callPill}>
                        <Icon name="phone" size={13} color="#FFFFFF" />
                        <Text style={styles.callText}>{contact.phone}</Text>
                    </View>
                </Pressable>
            ))}
        </Dialog>
    );
}

function LogoutDialog({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
    const [busy, setBusy] = useState(false);
    return (
        <Dialog
            visible={visible}
            onClose={onClose}
            icon="logout"
            tone="danger"
            title="Log out?"
            message="You will stop receiving push alerts on this device until you sign in again."
            dismissable={!busy}
            actions={
                <>
                    <Button title="Cancel" variant="ghost" size="md" onPress={onClose} disabled={busy} style={styles.flex} />
                    <Button
                        title="Log out"
                        variant="danger"
                        size="md"
                        loading={busy}
                        onPress={async () => {
                            setBusy(true);
                            try {
                                await onConfirm();
                            } finally {
                                setBusy(false);
                            }
                        }}
                        style={styles.flex}
                    />
                </>
            }
        />
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
        gap: 10,
    },
    flex: {
        flex: 1,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 6,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
    },
    profileText: {
        flex: 1,
        gap: 2,
    },
    name: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    detail: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    editButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginTop: 10,
        marginLeft: 4,
    },
    group: {
        padding: 0,
        overflow: 'hidden',
    },
    aboutText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 21,
    },
    error: {
        fontSize: 13,
        color: colors.danger,
    },
    contact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactPressed: {
        backgroundColor: colors.surfaceSubtle,
    },
    contactIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactName: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    contactText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
        lineHeight: 16,
    },
    callPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.success,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    callText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
});

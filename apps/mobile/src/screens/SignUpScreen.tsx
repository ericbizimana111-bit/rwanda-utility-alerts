import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { LogoEmblem } from '../components/LogoEmblem';
import { Icon } from '../components/Icon';
import { useAuthStore } from '../auth/store';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
    const signUp = useAuthStore((state) => state.signUp);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSignUp() {
        if (!phone.trim() || !password.trim()) {
            setError('Please enter a phone number and password.');
            return;
        }

        setError(null);
        setBusy(true);
        try {
            await signUp(
                phone.trim(),
                password,
                firstName.trim() || 'User',
                lastName.trim() || 'Account',
                email.trim() || undefined
            );
        } catch {
            setError('Unable to create account. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Brand Header */}
                    <View style={styles.brandHeader}>
                        <LogoEmblem size={48} />
                        <Text style={styles.brandTitle}>Rwanda Utility Alerts</Text>
                    </View>

                    {/* Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Sign up to receive instantaneous water & electricity alerts.
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        {/* Name row */}
                        <View style={styles.nameRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>First Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="First name"
                                        placeholderTextColor={colors.textMuted}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Last Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="Last name"
                                        placeholderTextColor={colors.textMuted}
                                        value={lastName}
                                        onChangeText={setLastName}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone number</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Icon name="phone" size={18} color={colors.textSecondary} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="e.g. 0780000000"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="phone-pad"
                                    autoCapitalize="none"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="name@example.com"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Icon name="lock" size={18} color={colors.textSecondary} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Choose password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                    hitSlop={10}
                                >
                                    <Icon
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={18}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Submit Button */}
                        <Pressable
                            style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
                            onPress={handleSignUp}
                            disabled={busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Create Account</Text>
                            )}
                        </Pressable>
                    </View>

                    {/* Footer */}
                    <View style={styles.footerRow}>
                        <Text style={styles.footerPrompt}>Already have an account? </Text>
                        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
        flexGrow: 1,
    },
    brandHeader: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    brandTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    titleSection: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    formSection: {
        gap: 16,
        marginBottom: 24,
    },
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 8,
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 8,
    },
    inputField: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: colors.textPrimary,
    },
    eyeBtn: {
        padding: 6,
    },
    errorText: {
        color: colors.alertRed,
        fontSize: 13,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
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
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    footerPrompt: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});

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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
    const signIn = useAuthStore((state) => state.signIn);
    const [phone, setPhone] = useState('0780000000');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSignIn() {
        setError(null);
        setBusy(true);
        try {
            await signIn(phone.trim(), password);
        } catch {
            setError('Unable to sign in. Please verify your credentials.');
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
                    {/* Brand Emblem */}
                    <View style={styles.brandHeader}>
                        <LogoEmblem size={52} />
                        <Text style={styles.brandTitle}>Rwanda Utility Alerts</Text>
                    </View>

                    {/* Sign In Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Sign In</Text>
                        <Text style={styles.subtitle}>
                            Access your account to get the latest alerts and updates.
                        </Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        {/* Phone Number Input */}
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

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Icon name="lock" size={18} color={colors.textSecondary} />
                                </View>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Password"
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

                        {/* Sign In Button */}
                        <Pressable
                            style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
                            onPress={handleSignIn}
                            disabled={busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Sign In</Text>
                            )}
                        </Pressable>
                    </View>

                    {/* Footer Create Account Link */}
                    <View style={styles.footerRow}>
                        <Text style={styles.footerPrompt}>Don't have an account? </Text>
                        <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
                            <Text style={styles.footerLink}>Create Account</Text>
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
        paddingTop: 40,
        paddingBottom: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    brandHeader: {
        alignItems: 'center',
        marginBottom: 36,
        gap: 10,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    titleSection: {
        marginBottom: 28,
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
        gap: 18,
        marginBottom: 32,
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
        marginTop: 'auto',
        paddingVertical: 12,
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

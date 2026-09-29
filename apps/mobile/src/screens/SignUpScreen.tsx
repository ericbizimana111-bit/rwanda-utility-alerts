import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RootScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AuthLayout } from '../components/AuthLayout';
import { Button, InfoNote, TextField } from '../components/ui';
import { useAuthStore } from '../auth/store';
import { errorMessage } from '../api/client';
import { isRwandanMobile } from '../utils/format';

type Errors = Partial<Record<'firstName' | 'lastName' | 'phone' | 'email' | 'password' | 'confirm', string>>;

function validate(values: { firstName: string; lastName: string; phone: string; email: string; password: string; confirm: string }): Errors {
    const errors: Errors = {};
    if (values.firstName.trim().length < 2) errors.firstName = 'Enter your first name';
    if (values.lastName.trim().length < 2) errors.lastName = 'Enter your last name';
    if (!isRwandanMobile(values.phone)) errors.phone = 'Use a Rwandan mobile number (072, 073, 078 or 079)';
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address';
    if (values.password.length < 6) errors.password = 'Use at least 6 characters';
    if (values.confirm !== values.password) errors.confirm = 'Passwords do not match';
    return errors;
}

export function SignUpScreen({ navigation }: RootScreenProps<'SignUp'>) {
    const signUp = useAuthStore((state) => state.signUp);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSignUp() {
        setError(null);
        const found = validate({ firstName, lastName, phone, email, password, confirm });
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        try {
            await signUp(phone.trim(), password, firstName.trim(), lastName.trim(), email.trim() || undefined);
        } catch (err) {
            setError(errorMessage(err, 'Unable to create your account. Please try again.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Get notified about electricity and water interruptions where you live and work."
            onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
            footer={
                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Pressable onPress={() => navigation.replace('Login')} hitSlop={8}>
                        <Text style={styles.footerLink}>Sign in</Text>
                    </Pressable>
                </View>
            }
        >
            <View style={styles.nameRow}>
                <TextField
                    label="First name"
                    placeholder="e.g. Aline"
                    autoComplete="given-name"
                    value={firstName}
                    onChangeText={setFirstName}
                    error={errors.firstName}
                    style={styles.nameField}
                />
                <TextField
                    label="Last name"
                    placeholder="e.g. Uwase"
                    autoComplete="family-name"
                    value={lastName}
                    onChangeText={setLastName}
                    error={errors.lastName}
                    style={styles.nameField}
                />
            </View>
            <TextField
                label="Phone number"
                icon="phone"
                placeholder="078 123 4567"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                hint="You will use this number to sign in."
                maxLength={16}
            />
            <TextField
                label="Email (optional)"
                icon="mail"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
            />
            <TextField
                label="Password"
                icon="lock"
                placeholder="At least 6 characters"
                secure
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
            />
            <TextField
                label="Confirm password"
                icon="lock"
                placeholder="Repeat your password"
                secure
                autoComplete="new-password"
                value={confirm}
                onChangeText={setConfirm}
                error={errors.confirm}
                onSubmitEditing={() => void handleSignUp()}
                returnKeyType="go"
            />
            {error ? <InfoNote tone="warning" icon="alert">{error}</InfoNote> : null}
            <Button title="Create account" onPress={() => void handleSignUp()} loading={busy} />
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    nameField: {
        flex: 1,
    },
    footerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.primary,
    },
});

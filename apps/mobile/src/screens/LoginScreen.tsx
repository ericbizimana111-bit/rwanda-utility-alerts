import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RootScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AuthLayout } from '../components/AuthLayout';
import { Button, InfoNote, TextField } from '../components/ui';
import { useAuthStore } from '../auth/store';
import { errorMessage } from '../api/client';
import { isRwandanMobile } from '../utils/format';

export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
    const signIn = useAuthStore((state) => state.signIn);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSignIn() {
        setError(null);
        setPhoneError(null);
        if (!isRwandanMobile(phone)) {
            setPhoneError('Enter your Rwandan mobile number, e.g. 078 123 4567');
            return;
        }
        if (!password) {
            setError('Enter your password.');
            return;
        }
        setBusy(true);
        try {
            await signIn(phone.trim(), password);
        } catch (err) {
            setError(errorMessage(err, 'Unable to sign in. Please try again.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to see outages and alerts for the areas you follow."
            onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
            footer={
                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>New to Rwanda Utility Alerts? </Text>
                    <Pressable onPress={() => navigation.replace('SignUp')} hitSlop={8}>
                        <Text style={styles.footerLink}>Create an account</Text>
                    </Pressable>
                </View>
            }
        >
            <TextField
                label="Phone number"
                icon="phone"
                placeholder="078 123 4567"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                value={phone}
                onChangeText={(value) => {
                    setPhone(value);
                    if (phoneError) setPhoneError(null);
                }}
                error={phoneError}
                maxLength={16}
            />
            <TextField
                label="Password"
                icon="lock"
                placeholder="Your password"
                secure
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => void handleSignIn()}
                returnKeyType="go"
            />
            {error ? <InfoNote tone="warning" icon="alert">{error}</InfoNote> : null}
            <Button title="Sign in" onPress={() => void handleSignIn()} loading={busy} />
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
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

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Button,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../auth/store';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
    const signUp = useAuthStore((state) => state.signUp);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit() {
        setError(null);
        setBusy(true);
        try {
            await signUp(phone.trim(), password, firstName.trim(), lastName.trim(), email.trim() || undefined);
            navigation.replace('Home');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to create account. Try again.';
            setError(message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <View style={styles.content}>
                    <Text style={styles.title}>Rwanda Utility Alerts</Text>
                    <Text style={styles.subtitle}>Create an account to receive outage alerts for your subscribed locations.</Text>
                    <TextInput autoCapitalize="words" placeholder="First name" value={firstName} onChangeText={setFirstName} style={styles.input} />
                    <TextInput autoCapitalize="words" placeholder="Last name" value={lastName} onChangeText={setLastName} style={styles.input} />
                    <TextInput autoCapitalize="none" keyboardType="phone-pad" placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} />
                    <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email (optional)" value={email} onChangeText={setEmail} style={styles.input} />
                    <TextInput secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {busy ? <ActivityIndicator /> : <Button title="Create account" onPress={submit} disabled={!firstName || !lastName || !phone || !password} />}
                    <Button title="Already have an account? Sign in" onPress={() => navigation.replace('Login')} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    flex: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
    title: { fontSize: 28, fontWeight: '700', color: '#123047' },
    subtitle: { color: '#526674', lineHeight: 22 },
    input: { backgroundColor: '#fff', borderColor: '#d8e1e8', borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16 },
    error: { color: '#b42318' },
});

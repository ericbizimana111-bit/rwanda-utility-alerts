import React, { useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../auth/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
    const signIn = useAuthStore((state) => state.signIn);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit() {
        setError(null);
        setBusy(true);
        try {
            await signIn(phone.trim(), password);
        } catch {
            setError('Unable to sign in. Check your details and try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Rwanda Utility Alerts</Text>
                <Text style={styles.subtitle}>Sign in to receive outage alerts for your subscribed locations.</Text>
                <TextInput autoCapitalize="none" keyboardType="phone-pad" placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} />
                <TextInput secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {busy ? <ActivityIndicator /> : <Button title="Sign in" onPress={submit} disabled={!phone || !password} />}
                <Button title="Create an account" onPress={() => navigation.navigate('SignUp')} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    content: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
    title: { fontSize: 28, fontWeight: '700', color: '#123047' },
    subtitle: { color: '#526674', lineHeight: 22 },
    input: { backgroundColor: '#fff', borderColor: '#d8e1e8', borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16 },
    error: { color: '#b42318' },
});

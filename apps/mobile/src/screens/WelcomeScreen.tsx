import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { LogoEmblem } from '../components/LogoEmblem';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.content}>
                {/* Top Brand Section */}
                <View style={styles.brandSection}>
                    <View style={styles.emblemGlow}>
                        <LogoEmblem size={72} />
                    </View>
                    <Text style={styles.title}>Rwanda Utility Alerts</Text>
                    <Text style={styles.subtitle}>Stay informed. Stay prepared.</Text>
                </View>

                {/* Hero Skyline Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/kigali_skyline.jpg')}
                        style={styles.skylineImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Actions & Footer */}
                <View style={styles.actionsSection}>
                    <Pressable
                        style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.primaryBtnText}>Sign In</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={styles.secondaryBtnText}>Create Account</Text>
                    </Pressable>

                    <Text style={styles.footerText}>
                        Real-time alerts for electricity and water outages in Rwanda.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    brandSection: {
        alignItems: 'center',
        paddingTop: 16,
        paddingHorizontal: 24,
    },
    emblemGlow: {
        marginBottom: 14,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    imageContainer: {
        width: width - 32,
        height: 180,
        alignSelf: 'center',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    skylineImage: {
        width: '100%',
        height: '100%',
    },
    actionsSection: {
        paddingHorizontal: 24,
        gap: 12,
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryBtn: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    secondaryBtnText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 16,
    },
    btnPressed: {
        opacity: 0.88,
    },
    footerText: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 18,
        paddingHorizontal: 16,
    },
});

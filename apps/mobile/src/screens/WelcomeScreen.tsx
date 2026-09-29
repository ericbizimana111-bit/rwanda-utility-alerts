import React from 'react';
import { View, Text, StyleSheet, Image, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootScreenProps } from '../navigation/types';
import { colors, gradients, radius, shadows } from '../theme/colors';
import { LogoEmblem } from '../components/LogoEmblem';
import { GradientBackground } from '../components/GradientBackground';
import { FlagStripe } from '../components/FlagStripe';
import { Icon, IconName } from '../components/Icon';
import { Button } from '../components/ui';

const FEATURES: Array<{ icon: IconName; color: string; bg: string; title: string; text: string }> = [
    {
        icon: 'lightning',
        color: colors.electricityIcon,
        bg: 'rgba(245, 158, 11, 0.18)',
        title: 'Electricity interruptions',
        text: 'Planned power cuts published by REG',
    },
    {
        icon: 'water',
        color: colors.waterIcon,
        bg: 'rgba(14, 165, 233, 0.18)',
        title: 'Water supply interruptions',
        text: 'Service notices published by WASAC',
    },
    {
        icon: 'bell',
        color: colors.flagYellow,
        bg: 'rgba(250, 210, 1, 0.16)',
        title: 'Alerts for your area',
        text: 'Follow your district or sector anywhere in Rwanda',
    },
];

export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
    const insets = useSafeAreaInsets();

    return (
        <GradientBackground colors={gradients.hero} decorated style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.brand}>
                    <View style={styles.logoHalo}>
                        <LogoEmblem size={64} />
                    </View>
                    <Text style={styles.title}>Rwanda Utility Alerts</Text>
                    <Text style={styles.subtitle}>Know before the power or water goes off.</Text>
                </View>

                <View style={styles.imageCard}>
                    <Image source={require('../../assets/kigali_skyline.jpg')} style={styles.image} resizeMode="cover" />
                    <FlagStripe height={4} />
                </View>

                <View style={styles.features}>
                    {FEATURES.map((feature) => (
                        <View key={feature.title} style={styles.feature}>
                            <View style={[styles.featureIcon, { backgroundColor: feature.bg }]}>
                                <Icon name={feature.icon} size={18} color={feature.color} />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureBody}>{feature.text}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.actions}>
                    <Button title="Create free account" variant="light" onPress={() => navigation.navigate('SignUp')} />
                    <Button title="I already have an account" variant="outlineLight" onPress={() => navigation.navigate('Login')} />
                    <Text style={styles.footnote}>
                        Information comes from official REG and WASAC announcements.{'\n'}This app is not operated by REG or WASAC.
                    </Text>
                </View>
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        gap: 24,
    },
    brand: {
        alignItems: 'center',
    },
    logoHalo: {
        padding: 12,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: colors.textOnDarkMuted,
        marginTop: 6,
        textAlign: 'center',
    },
    imageCard: {
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        ...shadows.raised,
    },
    image: {
        width: '100%',
        height: 170,
    },
    features: {
        gap: 14,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    featureBody: {
        fontSize: 13,
        color: colors.textOnDarkMuted,
        marginTop: 1,
    },
    actions: {
        gap: 12,
    },
    footnote: {
        fontSize: 11,
        lineHeight: 16,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        marginTop: 4,
    },
});

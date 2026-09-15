import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
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
import { SubscriptionCard } from '../components/SubscriptionCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/Icon';
import { api, ApiError, Subscription } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscriptions'>;

export function SubscriptionsScreen({ navigation }: Props) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadSubscriptions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getSubscriptions();
            setSubscriptions(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unable to load your subscriptions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            void loadSubscriptions();
        });
        void loadSubscriptions();
        return unsubscribe;
    }, [navigation, loadSubscriptions]);

    async function handleRemoveSubscription() {
        if (!selectedSub) return;
        setDeleting(true);
        setActionError(null);
        try {
            await api.deleteSubscription(selectedSub.id);
            setSubscriptions((prev) => prev.filter((s) => s.id !== selectedSub.id));
            setSelectedSub(null);
        } catch (err) {
            setActionError(
                err instanceof ApiError ? err.message : 'Unable to remove this subscription right now.'
            );
        } finally {
            setDeleting(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <AppHeader
                title="Subscriptions"
                showBack
                onBack={() => navigation.navigate('Home')}
            />

            <View style={styles.container}>
                {/* Subscriptions List */}
                {loading ? (
                    <LoadingState message="Loading subscriptions..." />
                ) : error ? (
                    <ErrorState
                        title="Unable to load subscriptions"
                        description={error}
                        buttonTitle="Retry"
                        onRetry={() => void loadSubscriptions()}
                    />
                ) : subscriptions.length === 0 ? (
                    <EmptyState
                        title="No subscriptions yet"
                        description="Subscribe to your home or office neighborhood to receive outage alerts."
                        buttonTitle="+ Add Subscription"
                        onButtonPress={() => navigation.navigate('AddSubscription')}
                    />
                ) : (
                    <View style={styles.content}>
                        <FlatList
                            data={subscriptions}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <SubscriptionCard
                                    subscription={item}
                                    onManage={() => setSelectedSub(item)}
                                />
                            )}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* + Add Subscription Button */}
                        <View style={styles.bottomCtaContainer}>
                            <Pressable
                                style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}
                                onPress={() => navigation.navigate('AddSubscription')}
                            >
                                <Icon name="plus" size={18} color="#FFFFFF" />
                                <Text style={styles.addBtnText}>Add Subscription</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>

            {/* Manage / Remove Subscription Modal */}
            <Modal visible={!!selectedSub} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Subscription</Text>
                            <Pressable onPress={() => setSelectedSub(null)} hitSlop={10}>
                                <Icon name="close" size={20} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        <Text style={styles.modalSubDesc}>
                            {selectedSub?.location?.district} — {selectedSub?.utility?.name}
                        </Text>
                        <Text style={styles.modalPrompt}>
                            Do you want to stop receiving utility outage alerts for this location?
                        </Text>

                        {actionError ? <Text style={styles.actionErrorText}>{actionError}</Text> : null}

                        <View style={styles.modalActionsRow}>
                            <Pressable
                                style={styles.cancelBtn}
                                onPress={() => setSelectedSub(null)}
                                disabled={deleting}
                            >
                                <Text style={styles.cancelBtnText}>Keep</Text>
                            </Pressable>

                            <Pressable
                                style={styles.deleteBtn}
                                onPress={() => void handleRemoveSubscription()}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.deleteBtnText}>Remove</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <BottomNavigation
                activeTab="Subscriptions"
                onTabPress={(tab) => {
                    if (tab === 'Home') navigation.navigate('Home');
                    else if (tab === 'Outages') navigation.navigate('Outages');
                    else if (tab === 'Reports') navigation.navigate('Reports');
                    else if (tab === 'More') navigation.navigate('Profile');
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
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    bottomCtaContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    addBtn: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    btnPressed: {
        opacity: 0.9,
    },
    addBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        gap: 12,
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
    modalSubDesc: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 4,
    },
    modalPrompt: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    modalActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 11,
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
    deleteBtn: {
        flex: 1,
        backgroundColor: colors.logoutRed,
        paddingVertical: 11,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    actionErrorText: {
        color: colors.alertRed,
        fontSize: 13,
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';

export interface DropdownOption {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    label?: string;
    placeholder: string;
    value: string | null;
    options: DropdownOption[];
    onSelect: (option: DropdownOption) => void;
}

export function CustomDropdown({
    label,
    placeholder,
    value,
    options,
    onSelect,
}: CustomDropdownProps) {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <Pressable
                style={({ pressed }) => [styles.box, pressed && styles.boxPressed]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={selectedOption ? styles.valueText : styles.placeholderText}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Icon name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>

            <Modal visible={modalVisible} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <SafeAreaView style={styles.modalContentWrapper}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{label || placeholder}</Text>
                                <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                                    <Icon name="close" size={20} color={colors.textSecondary} />
                                </Pressable>
                            </View>

                            <FlatList
                                data={options}
                                keyExtractor={(item) => item.value}
                                renderItem={({ item }) => {
                                    const isSelected = item.value === value;
                                    return (
                                        <Pressable
                                            style={[styles.optionRow, isSelected && styles.optionSelected]}
                                            onPress={() => {
                                                onSelect(item);
                                                setModalVisible(false);
                                            }}
                                        >
                                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                                {item.label}
                                            </Text>
                                            {isSelected && <Icon name="check" size={16} color={colors.primary} />}
                                        </Pressable>
                                    );
                                }}
                            />
                        </View>
                    </SafeAreaView>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    box: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    boxPressed: {
        backgroundColor: '#F8FAFC',
    },
    placeholderText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    valueText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContentWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        maxHeight: '60%',
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    optionRow: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    optionSelected: {
        backgroundColor: colors.primaryLight,
    },
    optionText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    optionTextSelected: {
        color: colors.primary,
        fontWeight: '700',
    },
});

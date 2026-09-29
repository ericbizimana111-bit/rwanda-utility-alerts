import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme/colors';
import { Icon, IconName } from './Icon';

export interface PickerOption {
    value: string;
    label: string;
    description?: string;
    /** Optional group heading, e.g. the province of a district. */
    group?: string;
}

interface SearchablePickerProps {
    label: string;
    placeholder: string;
    value: string | null;
    options: PickerOption[];
    onSelect: (option: PickerOption) => void;
    icon?: IconName;
    disabled?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
}

type Row = { type: 'group'; key: string; title: string } | { type: 'option'; key: string; option: PickerOption };

/** A field that opens a full-height, searchable list of options. */
export function SearchablePicker({
    label,
    placeholder,
    value,
    options,
    onSelect,
    icon = 'map-pin',
    disabled = false,
    searchPlaceholder = 'Search',
    emptyText = 'No matches found',
}: SearchablePickerProps) {
    const insets = useSafeAreaInsets();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selected = options.find((option) => option.value === value);

    const rows = useMemo<Row[]>(() => {
        const term = query.trim().toLowerCase();
        const filtered = term
            ? options.filter((option) => `${option.label} ${option.description ?? ''} ${option.group ?? ''}`.toLowerCase().includes(term))
            : options;
        const result: Row[] = [];
        let lastGroup: string | undefined;
        for (const option of filtered) {
            if (option.group && option.group !== lastGroup) {
                result.push({ type: 'group', key: `group-${option.group}`, title: option.group });
                lastGroup = option.group;
            }
            result.push({ type: 'option', key: option.value, option });
        }
        return result;
    }, [options, query]);

    function close() {
        setOpen(false);
        setQuery('');
    }

    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
                onPress={() => setOpen(true)}
                disabled={disabled}
                style={({ pressed }) => [styles.box, disabled && styles.boxDisabled, pressed && styles.boxPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
            >
                <Icon name={icon} size={18} color={selected ? colors.primary : colors.textMuted} />
                <View style={styles.boxText}>
                    <Text style={selected ? styles.value : styles.placeholder} numberOfLines={1}>
                        {selected?.label ?? placeholder}
                    </Text>
                    {selected?.description ? <Text style={styles.valueDescription} numberOfLines={1}>{selected.description}</Text> : null}
                </View>
                <Icon name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>

            <Modal visible={open} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
                <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 16) }]}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>{label}</Text>
                        <Pressable onPress={close} hitSlop={12} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
                            <Icon name="close" size={20} color={colors.textPrimary} />
                        </Pressable>
                    </View>
                    <View style={styles.search}>
                        <Icon name="search" size={17} color={colors.textMuted} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder={searchPlaceholder}
                            placeholderTextColor={colors.textMuted}
                            style={styles.searchInput}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        {query ? (
                            <Pressable onPress={() => setQuery('')} hitSlop={10}>
                                <Icon name="x-circle" size={17} color={colors.textMuted} />
                            </Pressable>
                        ) : null}
                    </View>
                    <FlatList
                        data={rows}
                        keyExtractor={(row) => row.key}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
                        renderItem={({ item }) => {
                            if (item.type === 'group') {
                                return <Text style={styles.group}>{item.title}</Text>;
                            }
                            const active = item.option.value === value;
                            return (
                                <Pressable
                                    onPress={() => {
                                        onSelect(item.option);
                                        close();
                                    }}
                                    style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.optionPressed]}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                >
                                    <View style={styles.optionText}>
                                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{item.option.label}</Text>
                                        {item.option.description ? <Text style={styles.optionDescription}>{item.option.description}</Text> : null}
                                    </View>
                                    {active ? <Icon name="check" size={18} color={colors.primary} /> : null}
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSubtle,
    },
    boxDisabled: {
        opacity: 0.55,
    },
    boxPressed: {
        borderColor: colors.primary,
    },
    boxText: {
        flex: 1,
        paddingVertical: 8,
    },
    placeholder: {
        fontSize: 15,
        color: colors.textMuted,
    },
    value: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    valueDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    sheet: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 8,
        paddingHorizontal: 14,
        height: 46,
        borderRadius: radius.md,
        backgroundColor: colors.background,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
    },
    group: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.textMuted,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 6,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    optionActive: {
        backgroundColor: colors.primaryLight,
    },
    optionPressed: {
        backgroundColor: colors.surfaceSubtle,
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 15,
        color: colors.textPrimary,
    },
    optionLabelActive: {
        fontWeight: '700',
        color: colors.primaryDark,
    },
    optionDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    empty: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: 40,
        fontSize: 14,
    },
});

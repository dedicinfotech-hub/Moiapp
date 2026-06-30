import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

interface SelectFieldProps<T> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SelectField<T extends string | number>({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  disabled,
}: SelectFieldProps<T>) {
  const insets = useSafeAreaInsets();
  const { scaledFontSize: fs } = useScaledTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label,
    [options, value]
  );

  const handleSelect = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontSize: fs.sm }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text
          style={[
            styles.triggerText,
            { fontSize: fs.md },
            !selectedLabel && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { fontSize: fs.md }]}>{label || placeholder}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { fontSize: fs.sm },
                        active && styles.optionTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.gold} /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.empty, { fontSize: fs.sm }]}>No options</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  triggerDisabled: { opacity: 0.6 },
  triggerText: { flex: 1, color: colors.text, fontWeight: '600' },
  placeholder: { color: colors.textMuted, fontWeight: '500' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingTop: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontWeight: '700', color: colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: { backgroundColor: colors.primaryLight },
  optionText: { flex: 1, color: colors.text },
  optionTextActive: { fontWeight: '700', color: colors.text },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});

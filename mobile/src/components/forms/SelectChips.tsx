import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

type Option<T extends string> = { value: T; label: string };

interface SelectChipsProps<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function SelectChips<T extends string>({ label, options, value, onChange }: SelectChipsProps<T>) {
  const { scaledFontSize: fs } = useScaledTheme();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontSize: fs.sm }]}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, { fontSize: fs.sm }, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const RELATION_OPTIONS = [
  { value: 'family' as const, label: 'Family' },
  { value: 'friend' as const, label: 'Friend' },
  { value: 'colleague' as const, label: 'Colleague' },
  { value: 'relative' as const, label: 'Relative' },
  { value: 'neighbor' as const, label: 'Neighbor' },
  { value: 'business' as const, label: 'Business' },
  { value: 'other' as const, label: 'Other' },
];

export const PAYMENT_MODE_OPTIONS = [
  { value: 'cash' as const, label: 'Cash' },
  { value: 'upi' as const, label: 'UPI' },
  { value: 'card' as const, label: 'Card' },
  { value: 'cheque' as const, label: 'Cheque' },
  { value: 'other' as const, label: 'Other' },
];

export const EVENT_TYPE_OPTIONS = [
  { value: 'wedding' as const, label: 'Wedding' },
  { value: 'birthday' as const, label: 'Birthday' },
  { value: 'engagement' as const, label: 'Engagement' },
  { value: 'valakaappu' as const, label: 'Valakaappu' },
  { value: 'housewarming' as const, label: 'Housewarming' },
  { value: 'graduation' as const, label: 'Graduation' },
  { value: 'custom' as const, label: 'Custom' },
];

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.gold, fontWeight: '700' },
});

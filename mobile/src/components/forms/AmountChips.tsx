import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, fontSize, spacing } from '../../theme';
import { formatCurrency } from '../../utils/format';

interface AmountChipsProps {
  values: number[];
  selected?: number | null;
  onSelect: (amount: number | null) => void;
  showOther?: boolean;
}

export function AmountChips({ values, selected, onSelect, showOther = true }: AmountChipsProps) {
  return (
    <View style={styles.row}>
      {values.map((v) => (
        <TouchableOpacity
          key={v}
          onPress={() => onSelect(v)}
          style={[styles.chip, selected === v && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === v && styles.chipTextActive]}>
            {formatCurrency(v)}
          </Text>
        </TouchableOpacity>
      ))}
      {showOther && (
        <TouchableOpacity
          onPress={() => onSelect(null)}
          style={[styles.chip, selected === null && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === null && styles.chipTextActive]}>Other</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.gold, fontWeight: '700' },
});

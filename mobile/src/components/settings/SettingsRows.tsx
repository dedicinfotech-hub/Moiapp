import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme';

interface SettingsToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({ title, subtitle, value, onValueChange }: SettingsToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

interface SettingsSelectRowProps<T extends string> {
  title: string;
  subtitle?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SettingsSelectRow<T extends string>({
  title,
  subtitle,
  value,
  options,
  onChange,
}: SettingsSelectRowProps<T>) {
  return (
    <View style={styles.selectBlock}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.chips}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SettingsInfoRowProps {
  label: string;
  subtitle: string;
  value: React.ReactNode;
  borderTop?: boolean;
}

export function SettingsInfoRow({ label, subtitle, value, borderTop = true }: SettingsInfoRowProps) {
  return (
    <View style={[styles.infoRow, !borderTop && styles.infoRowFirst]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={styles.infoValue}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  selectBlock: { paddingVertical: spacing.sm, gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.text },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoRowFirst: { borderTopWidth: 0 },
  infoValue: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
});

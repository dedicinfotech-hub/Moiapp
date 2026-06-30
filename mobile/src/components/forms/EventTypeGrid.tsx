import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../../api/types';
import { EVENT_TYPES } from '../../utils/createFunctionHelpers';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

interface Props {
  value: Event['event_type'];
  onChange: (v: Event['event_type']) => void;
  getLabel?: (value: Event['event_type'], fallback: string) => string;
}

export function EventTypeGrid({ value, onChange, getLabel }: Props) {
  const { scaledFontSize: fs } = useScaledTheme();

  return (
    <View style={styles.grid}>
      {EVENT_TYPES.map((type) => {
        const active = value === type.value;
        const label = getLabel ? getLabel(type.value, type.label) : type.label;
        return (
          <TouchableOpacity
            key={type.value}
            onPress={() => onChange(type.value)}
            style={[styles.tile, active && styles.tileActive]}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons name={type.icon as keyof typeof Ionicons.glyphMap} size={22} color={active ? colors.gold : colors.textMuted} />
            </View>
            <Text style={[styles.label, { fontSize: fs.xs }, active && styles.labelActive]} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tile: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  iconWrapActive: { backgroundColor: colors.primaryBorder },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  labelActive: { color: colors.gold, fontWeight: '700' },
});

import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../../theme';

export type EventHubTab = 'moi' | 'photos' | 'summary' | 'invitations' | 'returns';

const TABS: { id: EventHubTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'moi', label: 'Moi Register', icon: 'list-outline' },
  { id: 'photos', label: 'Photos', icon: 'images-outline' },
  { id: 'summary', label: 'Summary', icon: 'stats-chart-outline' },
  { id: 'invitations', label: 'Invitations', icon: 'people-outline' },
  { id: 'returns', label: 'Return Tracker', icon: 'gift-outline' },
];

interface Props {
  active: EventHubTab;
  onChange: (tab: EventHubTab) => void;
}

export function EventHubTabs({ active, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.content}>
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Ionicons name={t.icon} size={14} color={isActive ? colors.text : colors.textMuted} />
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 48, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.text, fontWeight: '700' },
});

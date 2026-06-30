import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontSize, spacing } from '../../theme';

interface RadioCardProps {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  features?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  accent?: 'primary' | 'secondary';
}

export function RadioCard({
  selected,
  onPress,
  title,
  subtitle,
  features,
  icon,
  accent = 'primary',
}: RadioCardProps) {
  const accentColor = accent === 'primary' ? colors.primary : colors.secondary;
  const accentBg = accent === 'primary' ? colors.primaryLight : colors.secondaryLight;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        selected && { borderColor: accentColor, backgroundColor: accentBg },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: accentBg }]}>
        <Ionicons name={icon} size={24} color={accentColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, selected && { color: accentColor }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>}
        {features?.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark" size={14} color={accentColor} />
            <Text style={[styles.feature, { color: accentColor }]}>{f}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.radio, selected && { borderColor: accentColor }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: accentColor }]} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, marginTop: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  feature: { fontSize: fontSize.xs },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});

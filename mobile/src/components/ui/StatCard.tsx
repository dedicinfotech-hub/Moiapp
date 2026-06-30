import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  bg?: string;
  valueColor?: string;
}

export function StatCard({ icon, label, value, sub, bg = colors.primaryLight, valueColor }: StatCardProps) {
  const { scaledFontSize: fs } = useScaledTheme();

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.label, { fontSize: fs.xs }]} numberOfLines={2}>
        {label}
      </Text>
      <Text
        style={[styles.value, { fontSize: fs.md }, valueColor && { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {sub ? <Text style={[styles.sub, { fontSize: fs.xs }]} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

/** Two equal-width cards per row (e.g. dashboard pairs). */
export function StatRow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[rowStyles.wrap, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={rowStyles.cell}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** Responsive 2-column grid for KPI cards (two cards per row). */
export function StatGrid({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const items = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={[gridStyles.wrap, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={rowStyles.wrap}>
          {row.map((child, cellIndex) => (
            <View key={cellIndex} style={rowStyles.cell}>
              {child}
            </View>
          ))}
          {row.length === 1 ? <View style={rowStyles.cell} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 0,
  },
  label: { color: colors.textSecondary, marginTop: 4 },
  value: { fontWeight: '700', color: colors.text, marginTop: 2 },
  sub: { color: colors.textMuted, marginTop: 2 },
});

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  cell: { flex: 1, minWidth: 0, maxWidth: '50%' },
});

const gridStyles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
});

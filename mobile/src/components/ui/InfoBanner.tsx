import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

interface InfoBannerProps {
  message: string;
  variant?: 'info' | 'warning' | 'success';
}

export function InfoBanner({ message, variant = 'info' }: InfoBannerProps) {
  const { scaledFontSize: fs } = useScaledTheme();
  const bg =
    variant === 'warning' ? colors.warningBg :
    variant === 'success' ? colors.successBg :
    colors.primaryLight;

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons
        name={variant === 'warning' ? 'shield-outline' : 'information-circle-outline'}
        size={18}
        color={colors.primary}
      />
      <Text style={[styles.text, { fontSize: fs.sm, lineHeight: fs.sm * 1.4 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.md,
  },
  text: { flex: 1, color: colors.text },
});

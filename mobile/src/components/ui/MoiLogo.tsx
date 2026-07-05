import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { APP_NAME } from '../../constants/brand';
import { colors, fontSize } from '../../theme';

interface MoiLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function MoiLogo({ variant = 'light', size = 'md' }: MoiLogoProps) {
  const moiSize = size === 'lg' ? 52 : size === 'md' ? 40 : 28;
  const subSize = size === 'lg' ? fontSize.xl : size === 'md' ? fontSize.lg : fontSize.sm;
  const textColor = variant === 'light' ? '#FFFFFF' : colors.purple;

  return (
    <View style={styles.wrap} accessibilityLabel={APP_NAME}>
      <Text style={[styles.moi, { fontSize: moiSize, color: textColor }]}>Moi</Text>
      <Text style={[styles.passBook, { fontSize: subSize, color: colors.primary }]}>PassBook</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  moi: { fontWeight: '800', letterSpacing: -1 },
  passBook: { fontStyle: 'italic', fontWeight: '600', marginTop: -4 },
});

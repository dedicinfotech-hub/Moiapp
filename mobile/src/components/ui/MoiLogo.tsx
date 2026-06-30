import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../theme';

interface MoiLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function MoiLogo({ variant = 'light', size = 'md' }: MoiLogoProps) {
  const moiSize = size === 'lg' ? 52 : size === 'md' ? 40 : 28;
  const appSize = size === 'lg' ? fontSize.xl : size === 'md' ? fontSize.lg : fontSize.sm;
  const textColor = variant === 'light' ? '#FFFFFF' : colors.purple;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.moi, { fontSize: moiSize, color: textColor }]}>Moi</Text>
      <Text style={[styles.app, { fontSize: appSize, color: colors.primary }]}>App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  moi: { fontWeight: '800', letterSpacing: -1 },
  app: { fontStyle: 'italic', fontWeight: '600', marginTop: -6, marginLeft: 32 },
});

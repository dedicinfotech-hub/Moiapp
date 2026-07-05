import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { APP_NAME } from '../../constants/brand';
import { colors, fontSize } from '../../theme';

interface LogoImageProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Text wordmark — Moi PassBook (replaces old logo.png image) */
export function LogoImage({ width = 160, height: _height = 40, style }: LogoImageProps) {
  const scale = Math.min(Math.max(width / 160, 0.65), 1.4);
  const moiSize = Math.round(22 * scale);
  const subSize = Math.round(fontSize.lg * scale);

  return (
    <View
      style={[styles.wrap, { maxWidth: width }, style]}
      accessibilityLabel={`${APP_NAME} logo`}
    >
      <Text style={[styles.moi, { fontSize: moiSize }]}>Moi </Text>
      <Text style={[styles.passBook, { fontSize: subSize }]}>PassBook</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  moi: {
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  passBook: {
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.primary,
  },
});

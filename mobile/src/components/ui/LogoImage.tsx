import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

const logoSource = require('../../../assets/logo.png');

interface LogoImageProps {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export function LogoImage({ width = 160, height = 40, style }: LogoImageProps) {
  return (
    <Image
      source={logoSource}
      style={[styles.logo, { width, height }, style]}
      resizeMode="contain"
      accessibilityLabel="MoiApp logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: { maxWidth: '100%' },
});

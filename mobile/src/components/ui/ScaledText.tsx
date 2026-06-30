import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { fontSize as baseFontSize } from '../../theme';

type FontSizeKey = keyof typeof baseFontSize;

interface ScaledTextProps extends TextProps {
  size?: FontSizeKey;
}

export function ScaledText({ size = 'md', style, ...props }: ScaledTextProps) {
  const { scaledFontSize } = useScaledTheme();
  return <Text style={[{ fontSize: scaledFontSize[size] }, style as TextStyle]} {...props} />;
}

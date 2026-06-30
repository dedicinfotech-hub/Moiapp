import { useMemo } from 'react';
import { fontSize as baseFontSize, spacing as baseSpacing } from './index';
import { useAppSettings } from '../context/AppSettingsContext';

export function useScaledTheme() {
  const { fontScale } = useAppSettings();

  return useMemo(() => {
    const scale = (n: number) => Math.round(n * fontScale);
    const scaledFontSize = Object.fromEntries(
      Object.entries(baseFontSize).map(([k, v]) => [k, scale(v)])
    ) as typeof baseFontSize;

    return {
      fontScale,
      scaledFontSize,
      scaledSpacing: baseSpacing,
    };
  }, [fontScale]);
}

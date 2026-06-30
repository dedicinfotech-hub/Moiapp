import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { useAppSettings } from '../../context/AppSettingsContext';
import { ScaledText } from './ScaledText';

interface OfflineBannerProps {
  embedded?: boolean;
}

export function OfflineBanner({ embedded = false }: OfflineBannerProps) {
  const { pendingCount, syncing, syncNow } = useOfflineSync();
  const { t } = useAppSettings();

  if (pendingCount === 0) return null;

  return (
    <View style={[styles.wrap, embedded && styles.embedded]}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <ScaledText size="sm" style={styles.text}>
        {pendingCount} {t('offlineEntries')} {t('offlineWaiting')}
      </ScaledText>
      <TouchableOpacity onPress={syncNow} disabled={syncing} style={styles.btn}>
        {syncing ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <ScaledText size="xs" style={styles.btnText}>{t('syncNow')}</ScaledText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  text: { flex: 1, color: colors.text, fontWeight: '600' },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  btnText: { fontWeight: '800', color: colors.text },
  embedded: { marginHorizontal: 0 },
});

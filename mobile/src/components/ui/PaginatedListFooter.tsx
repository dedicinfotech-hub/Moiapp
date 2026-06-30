import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAppSettings } from '../../context/AppSettingsContext';
import { colors, fontSize, spacing } from '../../theme';

interface ListFooterProps {
  loading?: boolean;
  hasMore: boolean;
  shown: number;
  total: number;
  onLoadMore: () => void;
}

export function PaginatedListFooter({ loading, hasMore, shown, total, onLoadMore }: ListFooterProps) {
  const { t } = useAppSettings();

  if (total === 0) return null;

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasMore) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.meta}>{t('showingAllItems').replace('{n}', String(total))}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.meta}>
        {t('showingOf').replace('{shown}', String(shown)).replace('{total}', String(total))}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={onLoadMore} activeOpacity={0.85}>
        <Text style={styles.btnText}>{t('loadMore')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  btn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  btnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
});

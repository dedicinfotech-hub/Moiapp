import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardHeader } from '../../components/layout/DashboardHeader';
import { AnalyticsScreen } from '../dashboard/AnalyticsScreen';
import { useSidebar } from '../../context/SidebarContext';
import { eventsApi, moiApi } from '../../api';
import type { MoiEntry } from '../../api/types';
import { formatCurrency, formatDateTime, getInitials, getAvatarColor, getEventDisplayName, formatMoiEntryAmount } from '../../utils/format';
import { usePagination } from '../../hooks/usePagination';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useAppSettings } from '../../context/AppSettingsContext';
import { colors, fontSize, radius, spacing } from '../../theme';

type EntryWithEvent = MoiEntry & { eventName: string };

export function GlobalMoiListScreen() {
  const insets = useSafeAreaInsets();
  const { setActiveModule } = useSidebar();
  const { t } = useAppSettings();
  const [entries, setEntries] = useState<EntryWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setActiveModule('moi-notebook');
    setLoading(true);
    eventsApi.list()
      .then(async (events) => {
        const all: EntryWithEvent[] = [];
        for (const ev of events) {
          try {
            const res = await moiApi.list(ev.id);
            (res.entries || []).forEach((e) => {
              all.push({ ...e, eventName: getEventDisplayName(ev) });
            });
          } catch { /* skip */ }
        }
        all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setEntries(all);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [setActiveModule]));

  const { visible, hasMore, loadMore, total } = usePagination(entries, 25);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DashboardHeader module="moi-notebook" showNewEvent={false} />
      <OfflineBanner />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          ListHeaderComponent={<Text style={styles.sub}>{total} {t('globalMoiCount')}</Text>}
          ListEmptyComponent={<Text style={styles.empty}>{t('globalMoiEmpty')}</Text>}
          onEndReached={() => { if (hasMore) loadMore(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <PaginatedListFooter
              hasMore={hasMore}
              shown={visible.length}
              total={total}
              onLoadMore={loadMore}
            />
          }
          renderItem={({ item, index }) => {
            const av = getAvatarColor(index);
            return (
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                  <Text style={{ color: av.text, fontWeight: '700' }}>{getInitials(item.guest_name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.guest_name}</Text>
                  <Text style={styles.event}>{item.eventName}</Text>
                  <Text style={styles.time}>{formatDateTime(item.created_at)}</Text>
                </View>
                <Text style={styles.amount}>{formatMoiEntryAmount(item)}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

export function GlobalReportsScreen() {
  const { setActiveModule } = useSidebar();

  useFocusEffect(useCallback(() => {
    setActiveModule('analytics');
  }, [setActiveModule]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DashboardHeader module="analytics" showNewEvent={false} />
      <AnalyticsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  event: { fontSize: fontSize.xs, color: colors.gold, marginTop: 2 },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  amount: { fontSize: fontSize.md, fontWeight: '800', color: colors.success },
  empty: { textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xl },
});

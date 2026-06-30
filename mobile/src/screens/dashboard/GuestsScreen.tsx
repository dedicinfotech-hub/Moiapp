import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import { eventsApi, moiApi } from '../../api';
import type { MoiEntry } from '../../api/types';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency, getInitials, parseAmount } from '../../utils/format';
import type { MoreStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

interface GuestSummary {
  name: string;
  count: number;
  total: number;
  lastDate: string;
  eventCount: number;
}

export function GuestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    eventsApi
      .list()
      .then(async (events) => {
        const all: MoiEntry[] = [];
        for (const ev of events) {
          try {
            const res = await moiApi.list(ev.id);
            all.push(...(res.entries || []));
          } catch { /* skip */ }
        }
        const map: Record<string, { name: string; count: number; total: number; lastDate: string; eventIds: Set<number> }> = {};
        all.forEach((e) => {
          const key = e.guest_name.toLowerCase().trim();
          if (!map[key]) {
            map[key] = { name: e.guest_name, count: 0, total: 0, lastDate: e.created_at, eventIds: new Set() };
          }
          map[key].count++;
          map[key].total += parseAmount(e.amount);
          map[key].eventIds.add(e.event_id);
          if (new Date(e.created_at) > new Date(map[key].lastDate)) map[key].lastDate = e.created_at;
        });
        const list = Object.values(map)
          .map(({ eventIds, ...g }) => ({ ...g, eventCount: eventIds.size }))
          .sort((a, b) => b.total - a.total);
        setGuests(list);
      })
      .catch(() => setGuests([]))
      .finally(() => setLoading(false));
  }, []));

  const filtered = useMemo(
    () => guests.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
    [guests, search]
  );
  const { visible, hasMore, loadMore, total } = usePagination(filtered, 25);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Guests"
        subtitle="Guest & user management"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.searchWrap}>
        <TextInput style={styles.search} placeholder="Search guests…" value={search} onChangeText={setSearch} />
        <Text style={styles.count}>{filtered.length} guests</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={styles.empty}>No guests found</Text>}
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.count} entries • {item.eventCount} events</Text>
                <Text style={styles.date}>
                  Last seen {new Date(item.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.total}>{formatCurrency(item.total)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.sm, marginBottom: spacing.sm },
  count: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: colors.gold, fontSize: fontSize.sm },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  total: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
});

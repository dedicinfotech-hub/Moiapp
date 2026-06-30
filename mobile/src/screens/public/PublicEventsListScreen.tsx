import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicGuestHeader } from '../../components/public/PublicGuestHeader';
import { PublicEventCard } from '../../components/public/PublicEventCard';
import { eventsApi } from '../../api';
import type { Event } from '../../api/types';
import { usePagination } from '../../hooks/usePagination';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import type { PublicStackParamList } from '../../navigation/types';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

type Filter = 'all' | 'upcoming' | 'past';

export function PublicEventsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    eventsApi
      .listPublic()
      .then((evs) => setEvents(Array.isArray(evs) ? evs : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []));

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((e) => {
      const matchSearch =
        !q ||
        (e.bride_name || '').toLowerCase().includes(q) ||
        (e.groom_name || '').toLowerCase().includes(q) ||
        (e.host_name || '').toLowerCase().includes(q) ||
        (e.custom_title || '').toLowerCase().includes(q) ||
        (e.venue || '').toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q);
      const matchFilter =
        filter === 'all' ? true : filter === 'upcoming' ? e.wedding_date >= today : e.wedding_date < today;
      return matchSearch && matchFilter;
    });
  }, [events, search, filter, today]);

  const upcomingCount = events.filter((e) => e.wedding_date >= today).length;
  const pastCount = events.filter((e) => e.wedding_date < today).length;

  const { visible, hasMore, loadMore, total } = usePagination(filtered, 15);

  const filterLabels: Record<Filter, string> = {
    all: `${t('all')} (${events.length})`,
    upcoming: `${t('filterUpcoming')} (${upcomingCount})`,
    past: `${t('filterPast')} (${pastCount})`,
  };

  return (
    <View style={styles.screen}>
      <PublicGuestHeader showBack onBack={() => navigation.goBack()} />
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: fs.xxl }]}>{t('publicListTitle')}</Text>
        <Text style={[styles.sub, { fontSize: fs.sm }]}>{t('publicListSub')}</Text>
        <TextInput
          style={[styles.search, { fontSize: fs.sm }]}
          placeholder={t('publicSearchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filters}>
          {(['all', 'upcoming', 'past'] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { fontSize: fs.xs }, filter === f && styles.filterTextActive]}>
                {filterLabels[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 32 }}
          ListEmptyComponent={<Text style={[styles.empty, { fontSize: fs.sm }]}>{t('publicNoSearchResults')}</Text>}
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
            <PublicEventCard
              event={item}
              onPress={() => navigation.navigate('PublicEventDetail', { slug: item.slug })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },
  search: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  filterText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: colors.text, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xl },
});

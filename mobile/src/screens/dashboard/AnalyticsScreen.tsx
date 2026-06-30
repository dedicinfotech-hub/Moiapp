import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { eventsApi, moiApi } from '../../api';
import type { Event, MoiEntry } from '../../api/types';
import { formatCurrency, getEventDisplayName, parseAmount } from '../../utils/format';
import { colors, fontSize, radius, spacing } from '../../theme';

function BreakdownBar({ label, amount, total }: { label: string; amount: number; total: number }) {
  const pct = total ? Math.round((amount / total) * 100) : 0;
  return (
    <View style={styles.barWrap}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue} numberOfLines={1}>
          {formatCurrency(amount)} ({pct}%)
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

export function AnalyticsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    eventsApi
      .list()
      .then(async (evs) => {
        setEvents(evs);
        const all: MoiEntry[] = [];
        for (const ev of evs) {
          try {
            const res = await moiApi.list(ev.id);
            all.push(...(res.entries || []));
          } catch { /* skip */ }
        }
        setEntries(all);
      })
      .catch(() => { setEvents([]); setEntries([]); })
      .finally(() => setLoading(false));
  }, []));

  const totalMoi = entries.reduce((s, e) => s + parseAmount(e.amount), 0);
  const byRelation = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.relation] = (acc[e.relation] || 0) + parseAmount(e.amount);
    return acc;
  }, {});
  const byMode = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.payment_mode] = (acc[e.payment_mode] || 0) + parseAmount(e.amount);
    return acc;
  }, {});

  const eventStats = events
    .map((ev) => {
      const evE = entries.filter((e) => e.event_id === ev.id);
      const total = evE.reduce((s, e) => s + parseAmount(e.amount), 0);
      return { ev, count: evE.length, total, avg: evE.length ? Math.round(total / evE.length) : 0 };
    })
    .sort((a, b) => b.total - a.total);

  const top5 = [...entries].sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount)).slice(0, 5);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
      <View style={styles.kpiGrid}>
        {[
          { label: 'Total Moi Collected', value: formatCurrency(totalMoi) },
          { label: 'Guest Entries', value: String(entries.length) },
          { label: 'Active Events', value: String(events.filter((e) => e.is_active).length) },
          { label: 'Average per Guest', value: entries.length ? formatCurrency(Math.round(totalMoi / entries.length)) : '₹0' },
        ].map((k) => (
          <View key={k.label} style={styles.kpi}>
            <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              {k.value}
            </Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Moi by Guest Relation</Text>
        {Object.keys(byRelation).length === 0 ? (
          <Text style={styles.empty}>No data yet</Text>
        ) : (
          Object.entries(byRelation)
            .sort((a, b) => b[1] - a[1])
            .map(([rel, amt]) => <BreakdownBar key={rel} label={rel} amount={amt} total={totalMoi} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Mode Split</Text>
        {Object.keys(byMode).length === 0 ? (
          <Text style={styles.empty}>No data yet</Text>
        ) : (
          Object.entries(byMode)
            .sort((a, b) => b[1] - a[1])
            .map(([mode, amt]) => <BreakdownBar key={mode} label={mode} amount={amt} total={totalMoi} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Performing Events</Text>
        {eventStats.length === 0 ? (
          <Text style={styles.empty}>No events yet</Text>
        ) : (
          eventStats.map(({ ev, count, total, avg }, i) => (
            <View key={ev.id} style={styles.eventRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName} numberOfLines={1}>{getEventDisplayName(ev)}</Text>
                <Text style={styles.eventMeta}>{count} guests · avg {formatCurrency(avg)}</Text>
              </View>
              <Text style={styles.eventTotal}>{formatCurrency(total)}</Text>
            </View>
          ))
        )}
      </View>

      {top5.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Contributors</Text>
          {top5.map((e, i) => (
            <View key={e.id} style={styles.eventRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Text style={[styles.eventName, { flex: 1 }]}>{e.guest_name}</Text>
              <Text style={styles.eventTotal}>{formatCurrency(e.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  kpi: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  kpiValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  barWrap: { marginBottom: spacing.md },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: fontSize.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  barValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  barTrack: { height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rank: { fontSize: fontSize.sm, fontWeight: '800', color: colors.gold, width: 20 },
  eventName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  eventMeta: { fontSize: fontSize.xs, color: colors.textSecondary },
  eventTotal: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  empty: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});

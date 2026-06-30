import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatCard, StatRow } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useEvent } from '../../hooks/useEvent';
import { moiApi } from '../../api';
import type { MoiEntry } from '../../api/types';
import { formatCurrency, formatDateTime, getInitials, getAvatarColor, getEventDisplayName } from '../../utils/format';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function EventDashboardScreen() {
  const slug = useScreenSlug();
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const insets = useSafeAreaInsets();
  const { event, loading } = useEvent(slug);
  const { t } = useAppSettings();
  const [entries, setEntries] = useState<MoiEntry[]>([]);

  const loadEntries = useCallback(() => {
    if (!event) return;
    moiApi.list(event.id).then((r) => setEntries(r.entries || [])).catch(() => setEntries([]));
  }, [event?.id]);

  useFocusEffect(useCallback(() => { loadEntries(); }, [loadEntries]));

  if (loading || !event) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const todayEntries = entries.filter((e) => new Date(e.created_at).toDateString() === new Date().toDateString());
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount, 0);
  const isEmpty = entries.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.getParent()?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle} numberOfLines={1}>{getEventDisplayName(event)}</Text>
          <View style={styles.activeRow}>
            <View style={styles.greenDot} />
            <Text style={styles.activeText}>{t('functionActive')}</Text>
          </View>
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
      </View>

      <View style={styles.body}>
        <View style={styles.infoRow}>
          {[
            { icon: 'calendar-outline' as const, text: formatDateTime(event.wedding_date).split(',')[0] },
            { icon: 'time-outline' as const, text: event.event_time || '10:30 AM' },
            { icon: 'location-outline' as const, text: event.venue || '—' },
            { icon: 'people-outline' as const, text: event.event_mode === 'new' ? 'New Event' : 'Past Event' },
          ].map((item) => (
            <View key={item.icon} style={styles.infoChip}>
              <Ionicons name={item.icon} size={14} color={colors.primary} />
              <Text style={styles.infoChipText} numberOfLines={2}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Live Collection Overview</Text>
        <StatRow>
          <StatCard icon={<Ionicons name="cash-outline" size={18} color={colors.gold} />} label={t('totalCollection')} value={formatCurrency(total)} sub={`${formatCurrency(todayTotal)} ${t('todayCollection')}`} bg={colors.primaryLight} valueColor={colors.gold} />
          <StatCard icon={<Ionicons name="people-outline" size={18} color={colors.blue} />} label="Total Entries" value={String(entries.length)} sub={`${todayEntries.length} Today`} bg={colors.blueBg} valueColor={colors.blue} />
        </StatRow>
        <StatRow>
          <StatCard icon={<Ionicons name="stats-chart-outline" size={18} color={colors.success} />} label="Average / Entry" value={formatCurrency(entries.length ? Math.round(total / entries.length) : 0)} bg={colors.successBg} valueColor={colors.success} />
          <StatCard icon={<Ionicons name="trophy-outline" size={18} color={colors.warning} />} label="Top Amount" value={formatCurrency(Math.max(0, ...entries.map((e) => e.amount)))} bg={colors.warningBg} valueColor={colors.warning} />
        </StatRow>

        <View style={styles.quickRow}>
          {[
            { icon: 'qr-code-outline' as const, label: 'View QR Code', screen: 'QRCode' as const },
            { icon: 'person-add-outline' as const, label: 'Add Manual Entry', screen: 'HostPaymentMethod' as const },
            { icon: 'list-outline' as const, label: 'Moi Register', tab: 'EventMoiRegister' as const },
            { icon: 'bar-chart-outline' as const, label: 'Reports', screen: 'EventReports' as const },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickAction}
              onPress={() => {
                if ('screen' in a && a.screen) navigation.navigate(a.screen, { slug });
                else navigation.getParent()?.navigate('EventMoiRegister' as never);
              }}
            >
              <View style={styles.quickIcon}><Ionicons name={a.icon} size={22} color={colors.primary} /></View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isEmpty ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="paper-plane" size={40} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>No Moi Entries Yet!</Text>
            <Text style={styles.emptySub}>Share your QR code with guests to start collecting Moi.</Text>
            <Button title="Share QR Code" onPress={() => navigation.navigate('QRCode', { slug })} style={{ marginTop: spacing.lg }} />
            <Button title="Add Manual Entry" variant="outline" onPress={() => navigation.navigate('HostPaymentMethod', { slug })} style={{ marginTop: spacing.md }} />
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Recent Moi Entries</Text>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('EventMoiRegister' as never)}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {entries.slice(0, 5).map((e, i) => {
              const av = getAvatarColor(i);
              return (
                <View key={e.id} style={styles.entryRow}>
                  <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                    <Text style={[styles.avatarText, { color: av.text }]}>{getInitials(e.guest_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{e.guest_name}</Text>
                    <Text style={styles.entryTime}>{formatDateTime(e.created_at)}</Text>
                  </View>
                  <Text style={styles.entryAmount}>{formatCurrency(e.amount)}</Text>
                </View>
              );
            })}
            <Button title="Share QR Code" onPress={() => navigation.navigate('QRCode', { slug })} style={{ marginTop: spacing.lg }} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  topTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  activeText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  body: { padding: spacing.lg },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  infoChip: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: radius.md },
  infoChipText: { fontSize: 10, color: colors.text, flex: 1 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg },
  quickAction: { alignItems: 'center', width: '23%' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 9, fontWeight: '700', color: colors.text, marginTop: 4, textAlign: 'center' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.sm, fontWeight: '700' },
  entryName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  entryTime: { fontSize: fontSize.xs, color: colors.textMuted },
  entryAmount: { fontSize: fontSize.md, fontWeight: '700', color: colors.success },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
});

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventHubLayout } from '../../components/event/EventHubLayout';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EditMoiModal } from './MoiEntryScreen';
import { BulkImportModal } from '../../components/moi/BulkImportModal';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useEvent } from '../../hooks/useEvent';
import { moiApi, exportCSV } from '../../api';
import type { MoiEntry } from '../../api/types';
import { formatCurrency, formatDateTime, getInitials, getAvatarColor, getEventDisplayName, formatMoiEntryAmount } from '../../utils/format';
import { usePagination } from '../../hooks/usePagination';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import type { EventStackParamList, EventTabParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

type SortOrder = 'newest' | 'oldest' | 'amount_high' | 'amount_low';
type PaymentFilter = 'all' | 'cash' | 'online';

function isOnlinePayment(entry: MoiEntry): boolean {
  return ['upi', 'card', 'cheque'].includes(entry.payment_mode);
}

function displayAmount(entry: MoiEntry): string {
  return formatMoiEntryAmount(entry);
}

/** Web /events/{slug} → Moi Register tab */
export function EventMoiRegisterScreen() {
  const slug = useScreenSlug();
  const navigation = useNavigation<CompositeNavigationProp<
    BottomTabNavigationProp<EventTabParamList>,
    NativeStackNavigationProp<EventStackParamList>
  >>();
  const insets = useSafeAreaInsets();
  const { event } = useEvent(slug);
  const { t } = useAppSettings();
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [editEntry, setEditEntry] = useState<MoiEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MoiEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!event) return;
    moiApi.list(event.id).then((r) => setEntries(r.entries || [])).catch(() => setEntries([]));
  }, [event?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (paymentFilter === 'cash' && isOnlinePayment(e)) return false;
        if (paymentFilter === 'online' && !isOnlinePayment(e)) return false;
        if (!q) return true;
        return (
          e.guest_name.toLowerCase().includes(q) ||
          (e.relation || '').toLowerCase().includes(q) ||
          (e.city || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sort === 'amount_high') return b.amount - a.amount;
        if (sort === 'amount_low') return a.amount - b.amount;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [entries, search, sort, paymentFilter]);

  const { visible, hasMore, loadMore, total: filteredTotal } = usePagination(filtered, 25);

  if (!event) return null;

  const cashTotal = entries.filter((e) => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + e.amount, 0);
  const giftCount = entries.filter((e) => e.gift_type === 'gift').length;
  const goldCount = entries.filter((e) => e.gift_type === 'gold').length;

  const cycleFilter = () => {
    const order: PaymentFilter[] = ['all', 'cash', 'online'];
    setPaymentFilter((f) => order[(order.indexOf(f) + 1) % order.length]);
  };

  const filterLabel = { all: t('allPayments'), cash: t('cashOnly'), online: t('onlineOnly') }[paymentFilter];

  const cycleSort = () => {
    const order: SortOrder[] = ['newest', 'oldest', 'amount_high', 'amount_low'];
    setSort((s) => order[(order.indexOf(s) + 1) % order.length]);
  };

  const sortLabel = { newest: 'Newest First', oldest: 'Oldest First', amount_high: 'Amount ↓', amount_low: 'Amount ↑' }[sort];

  const handleDelete = (item: MoiEntry) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await moiApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCSV(event.id, getEventDisplayName(event));
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <EventHubLayout slug={slug} activeTab="moi">
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>{t('moiRegister')}</Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity onPress={() => setShowSearch((v) => !v)}>
            <Ionicons name="search-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleFilter}>
            <Ionicons name="funnel-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleSort}>
            <Ionicons name="swap-vertical-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      {showSearch ? (
        <View style={styles.searchWrap}>
          <TextInput style={styles.searchInput} placeholder="Search name or relation..." value={search} onChangeText={setSearch} autoFocus />
        </View>
      ) : null}
      <View style={styles.statsSection}>
        <StatGrid>
          <StatCard icon={<Ionicons name="cash" size={16} color={colors.gold} />} label="Total Cash" value={formatCurrency(cashTotal)} bg={colors.primaryLight} valueColor={colors.gold} />
          <StatCard icon={<Ionicons name="people" size={16} color={colors.blue} />} label="Entries" value={String(entries.length)} bg={colors.blueBg} valueColor={colors.blue} />
          <StatCard icon={<Ionicons name="gift" size={16} color={colors.warning} />} label="Gifts" value={String(giftCount)} bg={colors.warningBg} valueColor={colors.warning} />
          <StatCard icon={<Ionicons name="diamond" size={16} color={colors.success} />} label="Gold" value={String(goldCount)} bg={colors.successBg} valueColor={colors.success} />
        </StatGrid>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 90 }}
        onEndReached={() => { if (hasMore) loadMore(); }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>All Entries ({filteredTotal}) · {filterLabel}</Text>
            <TouchableOpacity onPress={cycleSort}><Text style={styles.sort}>{sortLabel} ▾</Text></TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <PaginatedListFooter
            hasMore={hasMore}
            shown={visible.length}
            total={filteredTotal}
            onLoadMore={loadMore}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No entries yet. Use Manual, Voice, or Gift entry above.</Text>}
        renderItem={({ item, index }) => {
          const av = getAvatarColor(index);
          return (
            <View style={styles.entryRow}>
              <TouchableOpacity style={styles.entryMain} onPress={() => setEditEntry(item)} activeOpacity={0.7}>
                <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                  <Text style={[styles.avatarText, { color: av.text }]}>{getInitials(item.guest_name)}</Text>
                </View>
                <View style={styles.entryBody}>
                  <Text style={styles.name}>{item.guest_name}</Text>
                  <View style={styles.tags}>
                    <View style={styles.tag}><Text style={styles.tagText}>{item.gift_type || 'cash'}</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>{item.payment_mode}</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>{item.relation}</Text></View>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.right}>
                <Text style={styles.amount}>{displayAmount(item)}</Text>
                <Text style={styles.time}>{formatDateTime(item.created_at)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button title="+ Manual Entry" onPress={() => navigation.navigate('HostPaymentMethod', { slug })} style={{ flex: 2 }} />
        <Button title="Import" variant="outline" onPress={() => setShowBulkImport(true)} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Export" variant="outline" onPress={handleExport} loading={exporting} style={{ flex: 1 }} fullWidth={false} />
      </View>
      <BulkImportModal
        visible={showBulkImport}
        eventId={event.id}
        eventName={getEventDisplayName(event)}
        onClose={() => setShowBulkImport(false)}
        onImported={load}
      />
      <EditMoiModal entry={editEntry} visible={!!editEntry} onClose={() => setEditEntry(null)} onSaved={load} />
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Entry"
        message={deleteTarget ? `Remove ${deleteTarget.guest_name}'s entry?` : ''}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </EventHubLayout>
  );
}

/** @deprecated use EventMoiRegisterScreen */
export const MoiEntriesScreen = EventMoiRegisterScreen;

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  toolbarTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  toolbarActions: { flexDirection: 'row', gap: spacing.lg },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.surface },
  searchInput: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.sm },
  statsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, width: '100%' },
  list: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, width: '100%' },
  listTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sort: { fontSize: fontSize.sm, color: colors.textSecondary },
  entryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  entryMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minWidth: 0 },
  entryBody: { flex: 1, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: fontSize.sm },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  tags: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  tagText: { fontSize: 9, color: colors.textSecondary, textTransform: 'capitalize' },
  right: { alignItems: 'flex-end', marginLeft: spacing.sm },
  deleteBtn: { marginTop: 4, padding: 4 },
  amount: { fontSize: fontSize.md, fontWeight: '800', color: colors.gold },
  time: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xl },
});

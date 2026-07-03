import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { DashboardHeader } from '../../components/layout/DashboardHeader';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useSidebar } from '../../context/SidebarContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { eventsApi, exportCSV, emailPDF } from '../../api';
import type { Event } from '../../api/types';
import { formatCurrency, formatDate, getEventDisplayName } from '../../utils/format';
import { EventModeBadge, ApprovalBadge } from '../../components/event/EventModeBadge';
import { canAddMoi, getEventFlowScreen } from '../../utils/eventHelpers';
import { usePagination } from '../../hooks/usePagination';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

type FnNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Functions'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function EventActionButton({
  icon,
  onPress,
  disabled,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      hitSlop={4}
    >
      <Ionicons
        name={icon}
        size={18}
        color={disabled ? colors.border : danger ? colors.error : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

export function FunctionsScreen() {
  const navigation = useNavigation<FnNav>();
  const { setActiveModule } = useSidebar();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    eventsApi.list().then(setEvents).catch(() => setEvents([]));
  }, []);

  useFocusEffect(useCallback(() => {
    setActiveModule('events');
    load();
  }, [setActiveModule, load]));

  const openPublicEvent = (slug: string) => {
    navigation.navigate('PublicBrowse', {
      screen: 'PublicEventDetail',
      params: { slug },
    });
  };

  const openEvent = (item: Event) => {
    navigation.navigate('EventFlow', {
      screen: getEventFlowScreen(item),
      params: { slug: item.slug },
    });
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await eventsApi.delete(deleteId);
      setToast(t('eventDeleted'));
      load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExport = async (item: Event) => {
    setBusyId(item.id);
    try {
      await exportCSV(item.id, getEventDisplayName(item));
      setToast(t('csvExported'));
    } catch (e) {
      setToast(e instanceof Error ? e.message : t('exportFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleEmailPdf = async (item: Event) => {
    setBusyId(item.id);
    try {
      const res = await emailPDF(item.id);
      setToast(res.message || 'PDF emailed');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Email failed');
    } finally {
      setBusyId(null);
    }
  };

  const { visible, hasMore, loadMore, total } = usePagination(events, 15);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DashboardHeader module="events" />
      <OfflineBanner />
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><Text style={styles.toastDismiss}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('noEventsYet')}</Text>}
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
        renderItem={({ item }) => {
          const moiAllowed = canAddMoi(item);
          const busy = busyId === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => openEvent(item)} activeOpacity={0.85}>
                {item.cover_photo ? (
                  <Image source={{ uri: item.cover_photo }} style={styles.coverImage} />
                ) : (
                  <View style={styles.eventIcon}>
                    <Text style={styles.eventIconText}>{item.event_type?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { fontSize: fs.md }]}>{getEventDisplayName(item)}</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                <EventModeBadge event={item} />
                <ApprovalBadge event={item} />
              </View>
                  <Text style={[styles.meta, { fontSize: fs.xs }]}>{formatDate(item.wedding_date)} • {item.city || '—'}</Text>
                  <Text style={[styles.slug, { fontSize: fs.xs }]}>/{item.slug}</Text>
                </View>
                <View style={styles.right}>
                  <View style={[styles.badge, item.approval_status === 'approved' && styles.badgeGreen]}>
                    <Text style={styles.badgeText}>{item.approval_status || 'approved'}</Text>
                  </View>
                  <Text style={[styles.amount, { fontSize: fs.sm }]}>{formatCurrency(item.total_moi || 0)}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <Text style={styles.actionsLabel}>{t('actions')}</Text>
                <View style={styles.actions}>
                  {busy ? <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} /> : null}
                  <EventActionButton
                    icon="person-add-outline"
                    disabled={!moiAllowed}
                    onPress={() => moiAllowed && navigation.navigate('EventFlow', { screen: 'MoiEntry', params: { slug: item.slug } })}
                  />
                  <EventActionButton
                    icon="open-outline"
                    onPress={() => openPublicEvent(item.slug)}
                  />
                  <EventActionButton
                    icon="create-outline"
                    onPress={() => navigation.navigate('EventFlow', { screen: 'EventSettings', params: { slug: item.slug } })}
                  />
                  <EventActionButton icon="download-outline" onPress={() => handleExport(item)} />
                  <EventActionButton icon="mail-outline" onPress={() => handleEmailPdf(item)} />
                  <EventActionButton icon="trash-outline" danger onPress={() => setDeleteId(item.id)} />
                </View>
              </View>
            </View>
          );
        }}
      />

      <ConfirmModal
        visible={deleteId !== null}
        title={t('deleteEventTitle')}
        message={t('deleteEventMsg')}
        confirmText={t('deleteEventConfirm')}
        cancelText={t('cancel')}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  eventIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.border },
  eventIconText: { fontWeight: '800', color: colors.gold, fontSize: fontSize.md },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  slug: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { backgroundColor: colors.warningBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  badgeGreen: { backgroundColor: colors.successBg },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
  amount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionsLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.4 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  toastText: { color: '#fff', fontSize: fontSize.sm, flex: 1 },
  toastDismiss: { color: '#fff', fontWeight: '700', paddingLeft: spacing.md },
});

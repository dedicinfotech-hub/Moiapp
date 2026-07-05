import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { RejectReasonModal } from '../../components/ui/RejectReasonModal';
import { adminApi, eventsApi } from '../../api';
import type { AdminUser, SupportTicket, AdminFeatureToggle } from '../../api';
import type { Event } from '../../api/types';
import { formatCurrency } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useAdminLabels } from '../../i18n/useAdminLabels';
import type { AdminStackParamList, MainTabParamList, MoreStackParamList } from '../../navigation/types';
import { colors, fontSize, spacing, radius } from '../../theme';

type AdminNav = NativeStackNavigationProp<AdminStackParamList>;
type MoreNav = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

function useAdminBack() {
  const navigation = useNavigation<AdminNav>();
  return () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('AdminDashboard');
  };
}

function getEventLabel(ev: Event): string {
  if (ev.custom_title) return ev.custom_title;
  if (ev.event_type === 'birthday') return ev.birthday_person_name || 'Birthday';
  if (ev.event_type === 'graduation') return ev.graduate_name || 'Graduation';
  if (ev.event_type === 'housewarming') return `${ev.host_name || ''} & ${ev.spouse_name || ''}`.trim();
  if (ev.bride_name && ev.groom_name) return `${ev.bride_name} & ${ev.groom_name}`;
  return ev.slug;
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNav>();
  const moreNav = useNavigation<MoreNav>();
  const { t } = useAppSettings();
  const al = useAdminLabels();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    adminApi.getStats()
      .then((r) => setStats(r.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []));

  const menu = [
    { icon: 'checkmark-circle-outline' as const, label: t('modAdminApprovals'), screen: 'AdminApprovals' as const, badge: stats?.pendingApprovals },
    { icon: 'people-outline' as const, label: t('modAdminUsers'), screen: 'AdminUsers' as const },
    { icon: 'bar-chart-outline' as const, label: t('modAdminAnalytics'), screen: 'AdminAnalytics' as const },
    { icon: 'cash-outline' as const, label: t('modAdminRevenue'), screen: 'AdminRevenue' as const },
    { icon: 'headset-outline' as const, label: t('modAdminSupport'), screen: 'AdminSupport' as const, badge: stats?.openTickets },
    { icon: 'eye-outline' as const, label: t('modAdminPrivateEvents'), screen: 'AdminPrivateEvents' as const },
    { icon: 'toggle-outline' as const, label: t('modAdminFeatures'), screen: 'AdminFeatures' as const },
    { icon: 'shield-checkmark-outline' as const, label: t('modAdminLoginLogs'), screen: 'AdminLoginLogs' as const },
  ];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('adminPanel')}
        subtitle={t('platformOverview')}
        onBack={() => moreNav.navigate('MoreMenu')}
      />
      <FlatList
        data={menu}
        keyExtractor={(item) => item.label}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListHeaderComponent={
          stats ? (
            <StatGrid>
              <StatCard icon={<Ionicons name="people" size={16} color={colors.blue} />} label={al.totalUsers} value={String(stats.totalUsers)} bg={colors.blueBg} valueColor={colors.blue} />
              <StatCard icon={<Ionicons name="person-add" size={16} color={colors.success} />} label={al.newToday} value={String(stats.newToday ?? 0)} bg={colors.successBg} valueColor={colors.success} />
              <StatCard icon={<Ionicons name="pulse" size={16} color={colors.gold} />} label={al.activeToday} value={String(stats.activeToday ?? 0)} bg={colors.primaryLight} valueColor={colors.gold} />
              <StatCard icon={<Ionicons name="calendar" size={16} color={colors.gold} />} label={al.functions} value={String(stats.totalFunctions)} bg={colors.primaryLight} valueColor={colors.gold} />
              <StatCard icon={<Ionicons name="cash" size={16} color={colors.success} />} label={al.monthlyRevenue} value={formatCurrency(stats.monthlyRevenue)} bg={colors.successBg} valueColor={colors.success} />
              <StatCard icon={<Ionicons name="time" size={16} color={colors.warning} />} label={al.pendingReviews} value={String(stats.pendingApprovals)} bg={colors.warningBg} valueColor={colors.warning} />
              <StatCard icon={<Ionicons name="headset" size={16} color={colors.error} />} label={al.openTickets} value={String(stats.openTickets ?? 0)} bg={colors.errorBg} valueColor={colors.error} />
              <StatCard icon={<Ionicons name="eye" size={16} color={colors.blue} />} label={al.privateEventsStat} value={String(stats.activePrivateEvents ?? 0)} bg={colors.blueBg} valueColor={colors.blue} />
            </StatGrid>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate(item.screen)}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            {item.badge ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export function AdminApprovalsScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const { t } = useAppSettings();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    eventsApi.listPending(filter).then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false));
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmApprove = async () => {
    if (!confirmApproveId) return;
    const id = confirmApproveId;
    setConfirmApproveId(null);
    setActionLoading(id);
    try {
      await eventsApi.approve(id, { status: 'approved' });
      setToast(al.approved);
      load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.approveFailed);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async (reason: string) => {
    if (!rejectingId) return;
    const id = rejectingId;
    setActionLoading(id);
    try {
      await eventsApi.approve(id, { status: 'rejected', reason });
      setRejectingId(null);
      setToast(al.rejectedToast);
      load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.rejectFailed);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.approvals} onBack={goBack} />
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><Text style={styles.toastDismiss}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.filterRow}>
        {(['pending', 'rejected', 'all'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? al.allQueue : t(f)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={styles.empty}>{al.noEventsQueue}</Text>}
          renderItem={({ item }) => (
            <View style={styles.approvalCard}>
              <Text style={styles.approvalTitle}>{getEventLabel(item)}</Text>
              <Text style={styles.approvalMeta}>{item.event_type} • {item.city || '—'} • {item.wedding_date}</Text>
              {item.approval_reason ? <Text style={styles.rejectText}>{al.reason}: {item.approval_reason}</Text> : null}
              {item.approval_status === 'pending' ? (
                <View style={styles.approvalActions}>
                  <TouchableOpacity
                    style={[styles.approveBtn, actionLoading === item.id && styles.btnDisabled]}
                    onPress={() => setConfirmApproveId(item.id)}
                    disabled={actionLoading === item.id}
                  >
                    <Text style={styles.approveBtnText}>{actionLoading === item.id ? '…' : al.approve}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, actionLoading === item.id && styles.btnDisabled]}
                    onPress={() => setRejectingId(item.id)}
                    disabled={actionLoading === item.id}
                  >
                    <Text style={styles.rejectBtnText}>{al.reject}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
      <ConfirmModal
        visible={confirmApproveId !== null}
        title={al.approveTitle}
        message={al.approveMsg}
        confirmText={al.approve}
        cancelText={al.cancel}
        loading={actionLoading !== null}
        onConfirm={confirmApprove}
        onCancel={() => setConfirmApproveId(null)}
      />
      <RejectReasonModal
        visible={rejectingId !== null}
        loading={actionLoading === rejectingId}
        onSubmit={confirmReject}
        onCancel={() => setRejectingId(null)}
      />
    </View>
  );
}

export function AdminUsersScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmBlockId, setConfirmBlockId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getUsers().then((r) => setUsers(r.users)).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmBlock = async () => {
    if (!confirmBlockId) return;
    const userId = confirmBlockId;
    setConfirmBlockId(null);
    setActionLoading(userId);
    try {
      await adminApi.blockUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_blocked: 1 } : u)));
      setToast(al.userBlocked);
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.blockFailed);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const userId = confirmDeleteId;
    setConfirmDeleteId(null);
    setActionLoading(userId);
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setToast(al.userDeleted);
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.deleteUserFailed);
    } finally {
      setActionLoading(null);
    }
  };

  const blockTarget = users.find((u) => u.id === confirmBlockId);
  const deleteTarget = users.find((u) => u.id === confirmDeleteId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.users} onBack={goBack} />
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><Text style={styles.toastDismiss}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={styles.empty}>{al.noUsers}</Text>}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userMeta}>{item.phone || '—'} • {item.city || '—'} • {al.eventsCount(item.function_count)}</Text>
              </View>
              {item.is_blocked ? (
                <Text style={styles.blocked}>{al.blocked}</Text>
              ) : (
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <TouchableOpacity onPress={() => setConfirmBlockId(item.id)} disabled={actionLoading === item.id}>
                    <Text style={[styles.blockLink, actionLoading === item.id && { opacity: 0.5 }]}>
                      {actionLoading === item.id ? '…' : al.blockVerb}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setConfirmDeleteId(item.id)} disabled={actionLoading === item.id}>
                    <Text style={[styles.blockLink, { color: colors.error }]}>{al.delete}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
      <ConfirmModal
        visible={confirmBlockId !== null}
        title={al.blockUser}
        message={al.blockMsg(blockTarget?.name || 'this user')}
        confirmText={al.blockConfirm}
        cancelText={al.cancel}
        variant="danger"
        loading={actionLoading !== null}
        onConfirm={confirmBlock}
        onCancel={() => setConfirmBlockId(null)}
      />
      <ConfirmModal
        visible={confirmDeleteId !== null}
        title={al.deleteUser}
        message={al.deleteUserMsg(deleteTarget?.name || 'this user')}
        confirmText={al.delete}
        cancelText={al.cancel}
        variant="danger"
        loading={actionLoading !== null}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </View>
  );
}

export function AdminRevenueScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useFocusEffect(useCallback(() => {
    adminApi.getStats().then((r) => setStats(r.stats)).catch(() => setStats(null));
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.revenue} onBack={goBack} />
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <StatCard icon={<Ionicons name="cash" size={16} color={colors.success} />} label={al.totalRevenue} value={formatCurrency(stats?.totalRevenue || 0)} bg={colors.successBg} valueColor={colors.success} />
        <StatCard icon={<Ionicons name="trending-up" size={16} color={colors.gold} />} label={al.thisMonth} value={formatCurrency(stats?.monthlyRevenue || 0)} bg={colors.primaryLight} valueColor={colors.gold} />
        <StatCard icon={<Ionicons name="calendar" size={16} color={colors.blue} />} label={al.lastMonth} value={formatCurrency(stats?.lastMonthRevenue || 0)} bg={colors.blueBg} valueColor={colors.blue} />
      </View>
    </View>
  );
}

export function AdminAnalyticsScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof adminApi.getAnalytics>>['analytics'] | null>(null);

  useFocusEffect(useCallback(() => {
    adminApi.getAnalytics('monthly').then((r) => setAnalytics(r.analytics)).catch(() => setAnalytics(null));
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.analytics} onBack={goBack} />
      <FlatList
        data={analytics?.topCities || []}
        keyExtractor={(item) => item.city}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>{al.topCities}</Text>}
        renderItem={({ item }) => (
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>{item.city}</Text>
            <Text style={styles.analyticsValue}>{item.count} {al.usersSuffix}</Text>
          </View>
        )}
        ListFooterComponent={
          analytics?.featureUsage?.length ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{al.eventTypes}</Text>
              {analytics.featureUsage.map((item) => (
                <View key={item.event_type} style={styles.analyticsRow}>
                  <Text style={styles.analyticsLabel}>{item.event_type}</Text>
                  <Text style={styles.analyticsValue}>{item.count}</Text>
                </View>
              ))}
            </>
          ) : null
        }
      />
    </View>
  );
}

export function AdminSupportScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi.getTickets('open').then((r) => setTickets(r.tickets)).catch(() => setTickets([]));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resolve = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.resolveTicket(id);
      load();
      setToast(al.ticketResolved);
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.rejectFailed);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.support} onBack={goBack} />
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><Text style={styles.toastDismiss}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={styles.empty}>{al.noTickets}</Text>}
        renderItem={({ item }) => (
          <View style={styles.ticketCard}>
            <Text style={styles.ticketSubject}>{item.subject}</Text>
            <Text style={styles.ticketUser}>{item.user_name} • {item.user_email}</Text>
            <Text style={styles.ticketMsg}>{item.message}</Text>
            <TouchableOpacity
              style={[styles.resolveBtn, actionLoading === item.id && styles.btnDisabled]}
              onPress={() => resolve(item.id)}
              disabled={actionLoading === item.id}
            >
              <Text style={styles.resolveBtnText}>{actionLoading === item.id ? '…' : al.markResolved}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

export function AdminPrivateEventsScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const [events, setEvents] = useState<Awaited<ReturnType<typeof adminApi.getPrivateEvents>>['events']>([]);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    adminApi.getPrivateEvents().then((r) => setEvents(r.events)).catch(() => setEvents([]));
  }, []));

  const confirmDeactivate = async () => {
    if (!confirmDeactivateId) return;
    const id = confirmDeactivateId;
    setConfirmDeactivateId(null);
    setActionLoading(true);
    try {
      await adminApi.deactivateEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setToast(al.qrDeactivated);
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.rejectFailed);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.privateEvents} onBack={goBack} />
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><Text style={styles.toastDismiss}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={styles.empty}>{al.noPrivateEvents}</Text>}
        renderItem={({ item }) => (
          <View style={styles.approvalCard}>
            <Text style={styles.approvalTitle}>{item.host_name || item.event_type}</Text>
            <Text style={styles.approvalMeta}>{item.city} • {formatCurrency(item.total_moi)} • {al.guestsCount(item.guest_count)}</Text>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => setConfirmDeactivateId(item.id)}>
              <Text style={styles.rejectBtnText}>{al.deactivateQr}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <ConfirmModal
        visible={confirmDeactivateId !== null}
        title={al.deactivateQrTitle}
        message={al.deactivateQrMsg}
        confirmText={al.deactivateConfirm}
        cancelText={al.cancel}
        variant="danger"
        loading={actionLoading}
        onConfirm={confirmDeactivate}
        onCancel={() => setConfirmDeactivateId(null)}
      />
    </View>
  );
}

export function AdminFeaturesScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const [features, setFeatures] = useState<AdminFeatureToggle[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    adminApi.getFeatures().then((r) => setFeatures(r.features)).catch(() => setFeatures([]));
  }, []));

  const toggle = async (f: AdminFeatureToggle) => {
    try {
      await adminApi.updateFeature(f.id, f.is_enabled ? 0 : 1);
      setFeatures((prev) => prev.map((x) => (x.id === f.id ? { ...x, is_enabled: f.is_enabled ? 0 : 1 } : x)));
    } catch (e) {
      setToast(e instanceof Error ? e.message : al.featureFailed);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.features} onBack={goBack} />
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><Text style={styles.toastDismiss}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={features}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.featureRow} onPress={() => toggle(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureKey}>{item.feature_key}</Text>
              <Text style={styles.featureDesc}>{item.description}</Text>
            </View>
            <View style={[styles.toggle, item.is_enabled ? styles.toggleOn : styles.toggleOff]}>
              <Text style={styles.toggleText}>{item.is_enabled ? al.on : al.off}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export function AdminLoginLogsScreen() {
  const goBack = useAdminBack();
  const al = useAdminLabels();
  const { t } = useAppSettings();
  const [logs, setLogs] = useState<
    Array<{
      id: number;
      email: string | null;
      role: string | null;
      ip_address: string | null;
      user_agent: string | null;
      status: 'success' | 'failed' | 'blocked' | 'logout';
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'all' | 'success' | 'failed' | 'blocked' | 'logout'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getLoginLogs({
        page,
        limit: 40,
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      })
      .then((r) => {
        setLogs(r.logs);
        setTotalPages(r.pagination.pages || 1);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const statusColor = (s: string) => {
    if (s === 'success') return colors.success;
    if (s === 'blocked') return colors.warning;
    if (s === 'logout') return colors.primary;
    return colors.error;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={al.loginLogs} subtitle={al.loginLogsSub} onBack={goBack} />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <Input
          placeholder={al.searchLogs}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
          icon="search-outline"
        />
      </View>
      <View style={styles.filterRow}>
        {(['all', 'success', 'failed', 'blocked', 'logout'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, status === f && styles.filterActive]}
            onPress={() => { setPage(1); setStatus(f); }}
          >
            <Text style={[styles.filterText, status === f && styles.filterTextActive]}>{f === 'all' ? al.statusAll : t(f)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>{al.noLoginLogs}</Text>}
          renderItem={({ item }) => (
            <View style={styles.ticketCard}>
              <Text style={styles.ticketSubject}>{item.email || al.unknownUser}</Text>
              <Text style={[styles.ticketUser, { color: statusColor(item.status), fontWeight: '700' }]}>
                {item.status.toUpperCase()} · {item.role || 'user'} · {new Date(item.created_at).toLocaleString()}
              </Text>
              <Text style={styles.ticketMsg}>IP: {item.ip_address || '—'}</Text>
              {item.user_agent ? (
                <Text style={styles.ticketMsg} numberOfLines={2}>{item.user_agent}</Text>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.approvalActions}>
                <TouchableOpacity
                  style={[styles.rejectBtn, page <= 1 && styles.btnDisabled]}
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={styles.rejectBtnText}>{al.previous}</Text>
                </TouchableOpacity>
                <Text style={styles.userMeta}>{al.page(page, totalPages)}</Text>
                <TouchableOpacity
                  style={[styles.approveBtn, page >= totalPages && styles.btnDisabled]}
                  disabled={page >= totalPages}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <Text style={styles.approveBtnText}>{al.next}</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  statsGrid: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.error, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  filterText: { fontSize: fontSize.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  filterTextActive: { color: colors.gold, fontWeight: '700' },
  approvalCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  approvalTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  approvalMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  rejectText: { fontSize: fontSize.xs, color: colors.error, marginTop: 4 },
  approvalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  approveBtn: { flex: 1, backgroundColor: colors.success, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '700' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: colors.error, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  rejectBtnText: { color: colors.error, fontWeight: '700' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  userName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  userMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  blockLink: { color: colors.error, fontWeight: '600' },
  blocked: { color: colors.textMuted, fontSize: fontSize.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  analyticsLabel: { fontSize: fontSize.sm, color: colors.text },
  analyticsValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
  ticketCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  ticketSubject: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  ticketUser: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
  ticketMsg: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.sm },
  resolveBtn: { marginTop: spacing.md, alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  resolveBtnText: { color: colors.gold, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  featureKey: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  featureDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  toggle: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  toggleOn: { backgroundColor: colors.successBg },
  toggleOff: { backgroundColor: colors.border },
  toggleText: { fontSize: fontSize.xs, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  toastText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  toastDismiss: { fontSize: fontSize.md, color: colors.textMuted, paddingLeft: spacing.md },
  btnDisabled: { opacity: 0.5 },
});

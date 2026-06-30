import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { useSidebar } from '../../context/SidebarContext';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi, eventsApi } from '../../api';
import type { DashboardEvent } from '../../api/types';
import { formatCurrency, formatDate, getEventDisplayName } from '../../utils/format';
import { getEventFlowScreen } from '../../utils/eventHelpers';
import { usePagination } from '../../hooks/usePagination';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import { EventModeBadge, ApprovalBadge } from '../../components/event/EventModeBadge';
import { NotificationBellButton } from '../../components/ui/NotificationBellButton';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useAppSettings } from '../../context/AppSettingsContext';
import { navigateToModule } from '../../navigation/navigationRef';
import { getInitials, getAvatarColor } from '../../utils/format';
import { useEventReminders } from '../../hooks/useEventReminders';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing, shadow } from '../../theme';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const { open, setActiveModule } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  useEventReminders();
  const [allEvents, setAllEvents] = useState<DashboardEvent[]>([]);
  const [summary, setSummary] = useState({
    total_events: 0,
    total_cash: 0,
    total_guests: 0,
    pending_returns: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [dash, evList] = await Promise.all([
        dashboardApi.summary().catch(() => null),
        eventsApi.list(),
      ]);
      if (dash?.summary) {
        setSummary({
          total_events: dash.summary.total_events,
          total_cash: dash.summary.total_cash,
          total_guests: dash.summary.total_guests,
          pending_returns: dash.summary.pending_returns ?? 0,
        });
      }
      setAllEvents((dash?.recentEvents?.length ? dash.recentEvents : evList) as DashboardEvent[]);
    } catch {
      // keep cached values
    }
  };

  useFocusEffect(useCallback(() => {
    setActiveModule('dashboard');
    load();
  }, [setActiveModule]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const { visible: recentEvents, hasMore, loadMore, total } = usePagination(allEvents, 5);

  const statCards = [
    { label: t('totalFunctions'), value: String(summary.total_events), icon: 'people' as const, bg: colors.primaryLight, color: colors.gold },
    { label: t('totalMoi'), value: formatCurrency(summary.total_cash), icon: 'wallet' as const, bg: colors.successBg, color: colors.success },
    { label: t('totalContributors'), value: String(summary.total_guests), icon: 'person' as const, bg: colors.blueBg, color: colors.blue },
    { label: t('pendingReturns'), value: formatCurrency(summary.pending_returns), icon: 'time' as const, bg: colors.errorBg, color: colors.error },
  ];

  const quickActions: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  }[] = [
    { icon: 'create-outline', label: t('moiEntry'), onPress: () => navigation.navigate('EventFlow', { screen: 'ChooseEventType' }) },
    { icon: 'list-outline', label: t('moiNotebook'), onPress: () => navigation.navigate('MoiList') },
    { icon: 'qr-code-outline', label: t('qrCode'), onPress: () => navigation.navigate('EventFlow', { screen: 'ChooseEventType' }) },
    { icon: 'bar-chart-outline', label: t('reports'), onPress: () => navigation.navigate('ReportsTab') },
  ];

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
    >
      <AppHeader
        variant="hero"
        title={t('home')}
        onMenuPress={open}
        rightElement={(
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.profileChip}
              onPress={() => navigateToModule('settings')}
              hitSlop={8}
            >
              <View style={[styles.profileAvatar, { backgroundColor: getAvatarColor(0).bg }]}>
                <Text style={[styles.profileInitials, { color: getAvatarColor(0).text }]}>
                  {getInitials(user?.name || 'H')}
                </Text>
              </View>
              <Text style={[styles.profileName, { fontSize: fs.xs }]} numberOfLines={1}>
                {user?.name?.split(' ')[0] || t('profile')}
              </Text>
            </TouchableOpacity>
            <NotificationBellButton />
          </View>
        )}
        heroExtension={(
          <>
            <Text style={[styles.greeting, { fontSize: fs.xl }]}>
              {t('welcome')}, {user?.name?.split(' ')[0] || 'Host'} 👋
            </Text>
            <Text style={[styles.greetingSub, { fontSize: fs.sm }]}>{t('overview')}</Text>
          </>
        )}
      />

      <OfflineBanner />

      <View style={styles.statsGrid}>
        {statCards.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('EventFlow', { screen: 'ChooseEventType' })}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.createBtnText}>{t('createFunction')}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('quickActionsSection')}</Text>
      <View style={styles.quickRow}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.quickItem} onPress={a.onPress}>
            <View style={styles.quickIcon}>
              <Ionicons name={a.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recentFunctions')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Functions')}>
          <Text style={styles.viewAll}>{t('viewAll')} ›</Text>
        </TouchableOpacity>
      </View>

      {recentEvents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('noFunctionsYet')}</Text>
        </View>
      ) : (
        <>
          {recentEvents.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventFlow', {
                screen: getEventFlowScreen(ev as never),
                params: { slug: ev.slug },
              })}
            >
              <View style={styles.eventIcon}>
                <Text style={styles.eventIconLetter}>{ev.event_type?.charAt(0).toUpperCase() || 'E'}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{getEventDisplayName(ev as never)}</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                <EventModeBadge event={ev as never} />
                <ApprovalBadge event={ev as never} />
              </View>
                <Text style={styles.eventMeta}>{formatDate(ev.wedding_date)} • {ev.city || '—'}</Text>
              </View>
              <View style={styles.moiBadge}>
                <Text style={styles.moiBadgeLabel}>Moi</Text>
                <Text style={styles.moiBadgeValue}>{formatCurrency(ev.total_moi || 0)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <PaginatedListFooter
            hasMore={hasMore}
            shown={recentEvents.length}
            total={total}
            onLoadMore={loadMore}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 120 },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  profileInitials: { fontWeight: '800', fontSize: fontSize.xs },
  profileName: { fontWeight: '700', color: colors.text, flexShrink: 1 },
  greeting: { fontWeight: '800', color: colors.text },
  greetingSub: { color: colors.text, opacity: 0.7, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: -spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 6 },
  statValue: { fontSize: fontSize.lg, fontWeight: '800', marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  createBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  viewAll: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  quickItem: { alignItems: 'center', width: 72 },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIconLetter: { fontWeight: '800', color: colors.gold, fontSize: fontSize.md },
  eventInfo: { flex: 1 },
  eventName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  eventMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  moiBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  moiBadgeLabel: { fontSize: 8, color: colors.success },
  moiBadgeValue: { fontSize: fontSize.xs, fontWeight: '700', color: colors.success },
  empty: { margin: spacing.lg, padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.sm },
});

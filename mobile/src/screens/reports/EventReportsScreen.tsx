import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { useEvent } from '../../hooks/useEvent';
import { moiApi, exportCSV, emailPDF } from '../../api';
import type { MoiEntry } from '../../api/types';
import { formatCurrency, getInitials, getAvatarColor, getEventDisplayName, formatMoiEntryAmount } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing, shadow } from '../../theme';

function BreakdownBar({ label, amount, total }: { label: string; amount: number; total: number }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
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

const MODE_LABELS: Record<string, string> = {
  cash: 'cash',
  upi: 'UPI',
  card: 'CARD',
  cheque: 'CHEQUE',
  other: 'others',
};

export function EventReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { event, loading } = useEvent(slug);
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [exporting, setExporting] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const chartWidth = Math.max(220, screenW - spacing.lg * 4 - 8);

  useFocusEffect(useCallback(() => {
    if (!event) return;
    moiApi.list(event.id).then((r) => setEntries(r.entries || [])).catch(() => setEntries([]));
  }, [event?.id]));

  const filteredEntries = useMemo(() => (
    paymentFilter === 'all' ? entries : entries.filter((e) => e.payment_mode === paymentFilter)
  ), [entries, paymentFilter]);

  const total = filteredEntries.reduce((s, e) => s + e.amount, 0);
  const cashTotal = filteredEntries.filter((e) => e.payment_mode === 'cash').reduce((s, e) => s + e.amount, 0);
  const onlineTotal = Math.max(0, total - cashTotal);
  const cashPct = total > 0 ? Math.round((cashTotal / total) * 100) : 0;
  const onlinePct = total > 0 ? Math.round((onlineTotal / total) * 100) : 0;
  const topContributors = [...filteredEntries].sort((a, b) => b.amount - a.amount).slice(0, 5);

  const paymentDistribution = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      const mode = e.payment_mode || 'other';
      acc[mode] = (acc[mode] || 0) + e.amount;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [filteredEntries]);

  const trendData = useMemo(() => {
    const byDay: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      const label = new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      byDay[label] = (byDay[label] || 0) + e.amount;
    });
    return Object.entries(byDay)
      .slice(-7)
      .map(([label, value]) => ({
        value,
        label: label.split(' ')[0],
        dataPointText: formatCurrency(value),
      }));
  }, [filteredEntries]);

  const handleExportCsv = async () => {
    if (!event) return;
    setExporting(true);
    try {
      await exportCSV(event.id, getEventDisplayName(event));
    } catch (e) {
      Alert.alert(t('exportFailed'), e instanceof Error ? e.message : t('error'));
    } finally {
      setExporting(false);
    }
  };

  const handleEmailPdf = async () => {
    if (!event) return;
    setExporting(true);
    try {
      const res = await emailPDF(event.id);
      Alert.alert(res.success ? t('saved') : t('error'), res.message);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('error'));
    } finally {
      setExporting(false);
    }
  };

  const paymentModes = ['all', 'cash', 'upi', 'card', 'cheque', 'other'];

  const filterLabel = (mode: string) => {
    if (mode === 'all') return t('allMethods');
    if (mode === 'cash') return t('cash');
    if (mode === 'other') return t('others');
    return mode.toUpperCase();
  };

  if (loading || !event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('reports')}
        onBack={() => navigation.goBack()}
        rightElement={(
          <TouchableOpacity onPress={handleExportCsv} disabled={exporting} style={styles.headerAction}>
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <EventContextCard event={event} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {paymentModes.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setPaymentFilter(f)}
              style={[styles.filterChip, paymentFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, paymentFilter === f && styles.filterTextActive]}>
                {filterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <StatGrid>
          <StatCard
            icon={<Ionicons name="cash" size={16} color={colors.gold} />}
            label={t('totalCollection')}
            value={formatCurrency(total)}
            sub={`${filteredEntries.length} ${t('entriesLabel')}`}
            bg={colors.primaryLight}
            valueColor={colors.gold}
          />
          <StatCard
            icon={<Ionicons name="people" size={16} color={colors.blue} />}
            label={t('contributors')}
            value={String(filteredEntries.length)}
            bg={colors.blueBg}
            valueColor={colors.blue}
          />
          <StatCard
            icon={<Ionicons name="stats-chart" size={16} color={colors.success} />}
            label={t('avgPerEntry')}
            value={formatCurrency(filteredEntries.length ? Math.round(total / filteredEntries.length) : 0)}
            bg={colors.successBg}
            valueColor={colors.success}
          />
          <StatCard
            icon={<Ionicons name="trophy" size={16} color={colors.warning} />}
            label={t('topAmount')}
            value={formatCurrency(Math.max(0, ...filteredEntries.map((e) => e.amount)))}
            bg={colors.warningBg}
            valueColor={colors.warning}
          />
          <StatCard
            icon={<Ionicons name="wallet-outline" size={16} color={colors.success} />}
            label={t('cashTotal')}
            value={formatCurrency(cashTotal)}
            sub={t('percentOfTotal').replace('{n}', String(cashPct))}
            bg={colors.successBg}
            valueColor={colors.success}
          />
          <StatCard
            icon={<Ionicons name="phone-portrait-outline" size={16} color={colors.blue} />}
            label={t('onlineTotal')}
            value={formatCurrency(onlineTotal)}
            sub={t('percentOfTotal').replace('{n}', String(onlinePct))}
            bg={colors.blueBg}
            valueColor={colors.blue}
          />
        </StatGrid>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: fs.sm }]}>{t('collectionByMethod')}</Text>
          {paymentDistribution.length === 0 ? (
            <Text style={styles.noData}>{t('noChartData')}</Text>
          ) : (
            paymentDistribution.map(([mode, amount]) => (
              <BreakdownBar
                key={mode}
                label={MODE_LABELS[mode] === 'cash' ? t('cash') : MODE_LABELS[mode] === 'others' ? t('others') : (MODE_LABELS[mode] || mode)}
                amount={amount}
                total={total}
              />
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: fs.sm }]}>{t('collectionTrend')}</Text>
          {trendData.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={trendData}
                width={Math.max(chartWidth, trendData.length * 48)}
                height={150}
                color={colors.primary}
                thickness={3}
                dataPointsColor={colors.gold}
                startFillColor={colors.primaryLight}
                endFillColor={colors.surface}
                startOpacity={0.35}
                endOpacity={0.05}
                areaChart
                curved
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                noOfSections={4}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                rulesColor={colors.border}
              />
            </ScrollView>
          ) : (
            <Text style={styles.noData}>{t('noChartData')}</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: fs.sm }]}>{t('topContributors')}</Text>
          {topContributors.length === 0 ? (
            <Text style={styles.noData}>{t('noChartData')}</Text>
          ) : (
            topContributors.map((c, i) => {
              const av = getAvatarColor(i);
              const pct = total ? (c.amount / total) * 100 : 0;
              return (
                <View key={c.id} style={[styles.contributorRow, i < topContributors.length - 1 && styles.contribBorder]}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                    <Text style={{ color: av.text, fontWeight: '700', fontSize: 12 }}>{getInitials(c.guest_name)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.contribName} numberOfLines={1}>{c.guest_name}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.contribBarFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.contribAmount}>{formatMoiEntryAmount(c)}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.insightBox}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>{t('keyInsights')}</Text>
            <Text style={styles.insightText}>• {t('totalCollection')}: {formatCurrency(total)}</Text>
            <Text style={styles.insightText}>• {filteredEntries.length} {t('contributors')}</Text>
            <Text style={styles.insightText}>• {t('insightCashCommon')}</Text>
          </View>
        </View>

        <Button title={t('exportCsv')} onPress={handleExportCsv} loading={exporting} />
        <Button title={t('emailPdfReport')} variant="outline" onPress={handleEmailPdf} loading={exporting} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.lg },
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterContent: { gap: spacing.sm, paddingBottom: spacing.md },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: colors.text, fontWeight: '700' },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  sectionTitle: { fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  noData: { textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.sm, paddingVertical: spacing.lg },
  barWrap: { marginBottom: spacing.md },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: spacing.sm },
  barLabel: { fontSize: fontSize.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  barValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, flexShrink: 1 },
  barTrack: { height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  contribBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rank: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold, width: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  contribName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  barBg: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 4 },
  contribBarFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  contribAmount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
  insightBox: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  insightTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 4 },
  insightText: { fontSize: fontSize.sm, color: colors.textSecondary },
});

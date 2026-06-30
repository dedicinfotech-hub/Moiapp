import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EventHubLayout } from '../../components/event/EventHubLayout';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useEvent } from '../../hooks/useEvent';
import { moiApi, exportCSV, emailPDF } from '../../api';
import type { MoiEntry } from '../../api/types';
import { StatCard, StatRow } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { formatCurrency, getEventDisplayName } from '../../utils/format';
import { colors, fontSize, radius, spacing } from '../../theme';

function entryValue(e: MoiEntry) {
  if (e.gift_type === 'cash' || !e.gift_type) return Number(e.amount);
  return Number(e.approximate_value || e.amount || 0);
}

export function EventSummaryScreen() {
  const slug = useScreenSlug();
  const { event } = useEvent(slug);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!event) return;
    moiApi.list(event.id).then((r) => setEntries(r.entries || []));
  }, [event?.id]));

  if (!event) return null;

  const total = entries.reduce((s, e) => s + entryValue(e), 0);
  const cashTotal = entries.filter((e) => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const onlineTotal = entries.filter((e) => e.payment_mode !== 'cash' && (e.gift_type === 'cash' || !e.gift_type)).reduce((s, e) => s + Number(e.amount), 0);

  const byRelation = entries.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    const rel = e.relation || 'other';
    if (!acc[rel]) acc[rel] = { count: 0, total: 0 };
    acc[rel].count++;
    acc[rel].total += entryValue(e);
    return acc;
  }, {});

  const byPayment = entries.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    const mode = e.payment_mode || 'cash';
    if (!acc[mode]) acc[mode] = { count: 0, total: 0 };
    acc[mode].count++;
    acc[mode].total += entryValue(e);
    return acc;
  }, {});

  const top3 = [...entries].sort((a, b) => entryValue(b) - entryValue(a)).slice(0, 3);

  const shareWhatsApp = () => {
    const msg = `Moi Report Summary for ${getEventDisplayName(event)}:\nTotal: ${formatCurrency(total)}\nGuests: ${entries.length}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCSV(event.id, getEventDisplayName(event));
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export');
    } finally {
      setExporting(false);
    }
  };

  const handleEmailPdf = async () => {
    setExporting(true);
    try {
      const res = await emailPDF(event.id);
      Alert.alert(res.success ? 'Sent' : 'Notice', res.message);
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Could not send PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <EventHubLayout slug={slug} activeTab="summary">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <StatRow>
          <StatCard icon={<Ionicons name="cash" size={16} color={colors.gold} />} label="Total Moi Value" value={formatCurrency(total)} bg={colors.primaryLight} valueColor={colors.gold} />
          <StatCard icon={<Ionicons name="people" size={16} color={colors.blue} />} label="Total Guests" value={String(entries.length)} bg={colors.blueBg} valueColor={colors.blue} />
        </StatRow>
        <StatRow>
          <StatCard icon={<Ionicons name="wallet" size={16} color={colors.success} />} label="Cash" value={formatCurrency(cashTotal)} bg={colors.successBg} valueColor={colors.success} />
          <StatCard icon={<Ionicons name="phone-portrait" size={16} color={colors.warning} />} label="Online" value={formatCurrency(onlineTotal)} bg={colors.warningBg} valueColor={colors.warning} />
        </StatRow>

        <CardSection title="By Relation">
          {Object.entries(byRelation).map(([rel, data]) => (
            <Row key={rel} label={rel} sub={`(${data.count})`} value={formatCurrency(data.total)} />
          ))}
        </CardSection>

        <CardSection title="By Payment Mode">
          {Object.entries(byPayment).map(([mode, data]) => (
            <Row key={mode} label={mode} sub={`(${data.count})`} value={formatCurrency(data.total)} />
          ))}
        </CardSection>

        <CardSection title="Top 3 Contributors">
          {top3.map((c, i) => (
            <Row key={c.id} label={`${i + 1}. ${c.guest_name}`} value={formatCurrency(entryValue(c))} />
          ))}
          {top3.length === 0 ? <Text style={styles.empty}>No entries yet</Text> : null}
        </CardSection>

        <Button title="Export CSV" onPress={handleExport} loading={exporting} />
        <Button title="Email PDF Report" variant="outline" onPress={handleEmailPdf} loading={exporting} style={{ marginTop: spacing.md }} />
        <Button title="Share on WhatsApp" variant="outline" onPress={shareWhatsApp} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </EventHubLayout>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}{sub ? <Text style={styles.rowSub}> {sub}</Text> : null}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: fontSize.sm, color: colors.text, textTransform: 'capitalize' },
  rowSub: { fontSize: fontSize.xs, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
  empty: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
});

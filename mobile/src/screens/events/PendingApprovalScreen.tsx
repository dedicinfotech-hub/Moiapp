import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { eventsApi } from '../../api';
import type { Event } from '../../api/types';
import { formatDate, getEventDisplayName } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function PendingApprovalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const route = useRoute<RouteProp<EventStackParamList, 'PendingApproval'>>();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const poll = () => {
      eventsApi.get(route.params.slug).then((ev) => {
        setEvent(ev);
        if (ev.approval_status === 'approved') {
          navigation.replace('EventTabs', { slug: ev.slug });
        }
      }).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [route.params.slug, navigation]);

  const isPending = event?.approval_status === 'pending';
  const isRejected = event?.approval_status === 'rejected';

  const handleResubmit = async () => {
    if (!event) return;
    setResubmitting(true);
    setError('');
    try {
      await eventsApi.resubmit(event.id);
      const updated = await eventsApi.get(event.slug);
      setEvent(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('resubmitFailed'));
    } finally {
      setResubmitting(false);
    }
  };

  const details = event ? [
    { label: t('lblFunctionName'), value: getEventDisplayName(event) },
    { label: t('lblDate'), value: formatDate(event.wedding_date) },
    { label: t('lblTime'), value: event.event_time || '10:30 AM' },
    { label: t('lblLocation'), value: `${event.venue || '—'}${event.city ? `, ${event.city}` : ''}` },
    { label: t('cfEventType'), value: event.event_mode === 'new' ? t('newEvent') : t('pastEvent') },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('pendingApprovalTitle')} onBack={() => navigation.getParent()?.goBack()} />
      <SafeScreen>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, isRejected && styles.heroIconRejected]}>
            <Ionicons name={isRejected ? 'close-circle-outline' : 'clipboard-outline'} size={40} color={isRejected ? colors.error : colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { fontSize: fs.xl }]}>
            {isRejected ? t('functionRejectedTitle') : t('functionSubmitted')}
          </Text>
          <Text style={[styles.heroSub, { fontSize: fs.sm }]}>
            {isRejected ? t('rejectedReviewSub') : t('pendingReviewSub')}
          </Text>
          {isPending ? (
            <View style={styles.badge}>
              <Ionicons name="hourglass-outline" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>{t('pendingApprovalTitle')}</Text>
            </View>
          ) : null}
          {isRejected ? (
            <View style={[styles.badge, styles.badgeRejected]}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.badgeText, { color: colors.error }]}>{t('rejected')}</Text>
            </View>
          ) : null}
        </View>

        {isRejected && event?.approval_reason ? (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectTitle}>{t('rejectionReasonTitle')}</Text>
            <Text style={styles.rejectText}>{event.approval_reason}</Text>
          </View>
        ) : null}

        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('functionDetailsTitle')}</Text>
          </View>
          {details.map((d) => (
            <View key={d.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { fontSize: fs.sm }]}>
            {isPending ? t('pendingDisabledInfo') : t('rejectedDisabledInfo')}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isRejected ? (
          <>
            <Button title={t('editFunction')} onPress={() => navigation.navigate('EventSettings', { slug: route.params.slug })} />
            <Button title={t('resubmitForApproval')} onPress={handleResubmit} loading={resubmitting} style={{ marginTop: spacing.md }} />
          </>
        ) : (
          <View style={styles.notifyBox}>
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.notifyText}>{t('notifyApproved')}</Text>
          </View>
        )}

        <Button
          title={t('goToHome')}
          variant="outline"
          onPress={() => navigation.getParent()?.goBack()}
          style={{ marginTop: spacing.lg }}
        />
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroIconRejected: { backgroundColor: colors.errorBg },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, marginTop: spacing.md },
  badgeRejected: { backgroundColor: colors.errorBg },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  rejectBox: { backgroundColor: colors.errorBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg },
  rejectTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.error, marginBottom: 4 },
  rejectText: { fontSize: fontSize.sm, color: colors.textSecondary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  detailValue: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text, textAlign: 'right', flex: 1, marginLeft: spacing.md },
  infoBox: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.primaryLight, padding: spacing.lg, borderRadius: radius.lg, marginVertical: spacing.lg },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  notifyBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.lg },
  notifyText: { flex: 1, color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: 'center' },
});

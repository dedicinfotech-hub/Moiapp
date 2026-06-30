import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useApprovalGuard } from '../../hooks/useApprovalGuard';
import { eventsApi } from '../../api';
import { getEventDisplayName, formatDate } from '../../utils/format';
import { showEventQr } from '../../utils/eventHelpers';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const GUEST_BASE = 'https://dsitesai.com/moiapp/g';

export function QRCodeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { t } = useAppSettings();
  const { event, reload } = useApprovalGuard(slug);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [qrCount, setQrCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const qrRef = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);

  const refreshStats = useCallback(async () => {
    if (!slug) return;
    try {
      const ev = await eventsApi.get(slug);
      setQrEnabled(ev.qr_enabled !== 0);
      setQrCount(Number(ev.stats?.qr_payment_count ?? ev.qr_payment_count ?? 0));
    } catch { /* ignore */ }
  }, [slug]);

  useEffect(() => {
    if (event) {
      setQrEnabled(event.qr_enabled !== 0);
      setQrCount(Number(event.stats?.qr_payment_count ?? event.qr_payment_count ?? 0));
    }
  }, [event?.id, event?.qr_enabled, event?.qr_payment_count]);

  useEffect(() => {
    if (!event?.guest_token || !qrEnabled) return;
    const t = setInterval(refreshStats, 15000);
    return () => clearInterval(t);
  }, [event?.guest_token, qrEnabled, refreshStats]);

  if (!event) return null;

  const guestLink = `${GUEST_BASE}/${event.guest_token || slug}`;
  const displayName = getEventDisplayName(event);
  const canShowQr = showEventQr(event);

  const copyLink = async () => {
    await Clipboard.setStringAsync(guestLink);
    Alert.alert(t('copied'), t('linkCopied'));
  };

  const shareLink = async () => {
    await Share.share({ message: `Send your Moi for ${displayName}: ${guestLink}` });
  };

  const shareWhatsApp = () => {
    const text = `${displayName} — Give Moi via QR (no app needed):\n${guestLink}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const toggleQr = async () => {
    setLoading(true);
    try {
      const res = await eventsApi.setQrEnabled(event.id, !qrEnabled);
      setQrEnabled(!!res.qr_enabled);
      await reload();
      Alert.alert(t('updated'), res.qr_enabled ? t('qrEnabledMsg') : t('qrDisabledMsg'));
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : 'Failed to update QR status');
    } finally {
      setLoading(false);
    }
  };

  const regenerateQr = () => setShowRegenerate(true);

  const confirmRegenerate = async () => {
    if (!event) return;
    setShowRegenerate(false);
    setLoading(true);
    try {
      await eventsApi.regenerateQr(event.id);
      await reload();
      Alert.alert(t('done'), t('qrRegenerated'));
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : 'Failed to regenerate');
    } finally {
      setLoading(false);
    }
  };

  const downloadQr = async () => {
    if (!qrRef.current) {
      shareLink();
      return;
    }
    qrRef.current.toDataURL(async (data) => {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = data;
        a.download = `moi-qr-${slug}.png`;
        a.click();
        return;
      }
      try {
        const base64 = data.replace(/^data:image\/png;base64,/, '');
        const fileUri = `${FileSystem.cacheDirectory}moi-qr-${slug}.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: 'Save QR Code' });
        } else {
          Alert.alert('Saved', 'QR image saved to cache');
        }
      } catch {
        shareLink();
      }
    });
  };

  const steps = [
    { icon: 'clipboard-outline', title: t('qrStepForm'), sub: t('qrStepFormSub') },
    { icon: 'cash-outline', title: t('qrStepPay'), sub: t('qrStepPaySub') },
    { icon: 'checkmark-circle-outline', title: t('qrStepSuccess'), sub: t('qrStepSuccessSub') },
    { icon: 'heart-outline', title: t('qrStepThanks'), sub: t('qrStepThanksSub') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('qrGuestPaymentTitle')} onBack={() => navigation.goBack()} />
      <SafeScreen>
        <Text style={styles.sub}>{t('qrGuestPaymentSub')}</Text>

        {!canShowQr ? (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>
              {event.event_mode === 'past' ? t('qrPastNoCode') : t('qrPendingApproval')}
            </Text>
          </View>
        ) : (
          <>
        {canShowQr ? (
          <View style={styles.statsBar}>
            <Text style={styles.statsLabel}>{t('qrPaymentsCount')}: <Text style={styles.statsCount}>{qrCount}</Text></Text>
            <TouchableOpacity onPress={refreshStats}><Text style={styles.refresh}>{t('refresh')}</Text></TouchableOpacity>
          </View>
        ) : null}

        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.eventRow}>
            <View style={styles.eventItem}><Ionicons name="calendar-outline" size={16} color={colors.primary} /><Text style={styles.eventText}>{formatDate(event.wedding_date)}</Text></View>
            <View style={styles.eventItem}><Ionicons name="location-outline" size={16} color={colors.primary} /><Text style={styles.eventText}>{event.venue || event.city || '—'}</Text></View>
          </View>
        </Card>

        {!qrEnabled ? (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>{t('qrGuestClosed')}</Text>
            <Button title={t('reEnableQr')} onPress={toggleQr} loading={loading} style={{ marginTop: spacing.md }} />
          </View>
        ) : (
          <>
            <Text style={styles.linkLabel}>{t('guestPaymentLink')}</Text>
            <View style={styles.linkBox}>
              <Ionicons name="link-outline" size={16} color={colors.primary} />
              <Text style={styles.linkText} numberOfLines={1}>{guestLink}</Text>
              <TouchableOpacity onPress={copyLink}><Ionicons name="copy-outline" size={18} color={colors.primary} /></TouchableOpacity>
            </View>
            <Button title={t('copyLink')} onPress={copyLink} style={{ marginBottom: spacing.lg }} />

            <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <Text style={styles.qrTitle}>{t('scanToSendMoi')}</Text>
              <Text style={styles.qrSub}>{t('scanQrSub')}</Text>
              <View style={styles.qrWrap}>
                <QRCode value={guestLink} size={180} getRef={(c) => { qrRef.current = c; }} />
              </View>
              <Text style={styles.uniqueNote}>{t('linkUniqueNote')}</Text>
            </Card>
          </>
        )}

        <Text style={styles.howTitle}>{t('howItWorks')}</Text>
        <View style={styles.stepsRow}>
          {steps.map((s) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepIcon}><Ionicons name={s.icon as never} size={20} color={colors.primary} /></View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <View style={styles.secureBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.gold} />
          <View><Text style={styles.secureTitle}>{t('secureTrusted')}</Text><Text style={styles.secureSub}>{t('secureTrustedSub')}</Text></View>
        </View>

        {qrEnabled ? (
          <>
            <Button title={t('whatsappShare')} onPress={shareWhatsApp} />
            <Button title={t('shareLink')} variant="outline" onPress={shareLink} style={{ marginTop: spacing.md }} />
            <Button title={t('downloadQr')} variant="outline" onPress={downloadQr} style={{ marginTop: spacing.md }} />
          </>
        ) : null}
        {canShowQr ? (
          <View style={styles.adminRow}>
            <Button title={qrEnabled ? t('closeQr') : t('openQr')} variant="outline" onPress={toggleQr} loading={loading} style={{ flex: 1 }} fullWidth={false} />
            <Button title={t('regenerateQr')} variant="outline" onPress={regenerateQr} loading={loading} style={{ flex: 1 }} fullWidth={false} />
          </View>
        ) : null}
          </>
        )}
      </SafeScreen>
      <ConfirmModal
        visible={showRegenerate}
        title={t('regenerateQrTitle')}
        message={t('regenerateQrMsg')}
        confirmText={t('regenerateQr')}
        cancelText={t('cancel')}
        variant="danger"
        loading={loading}
        onConfirm={confirmRegenerate}
        onCancel={() => setShowRegenerate(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statsLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  statsCount: { fontWeight: '800', color: colors.text },
  refresh: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' },
  eventRow: { gap: spacing.sm },
  eventItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eventText: { fontSize: fontSize.sm, color: colors.text, flex: 1 },
  closedBox: { backgroundColor: colors.border, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg },
  closedText: { fontSize: fontSize.sm, color: colors.textSecondary },
  linkLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  linkText: { flex: 1, fontSize: fontSize.xs, color: colors.text },
  qrTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gold },
  qrSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  qrWrap: { marginVertical: spacing.xl, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg },
  uniqueNote: { fontSize: fontSize.xs, color: colors.textMuted },
  howTitle: { textAlign: 'center', color: colors.textSecondary, marginVertical: spacing.lg, fontWeight: '600' },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  step: { width: '23%', alignItems: 'center', marginBottom: spacing.md },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 8, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 4 },
  stepSub: { fontSize: 7, color: colors.textMuted, textAlign: 'center' },
  secureBanner: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.goldBg, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg },
  secureTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  secureSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  adminRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});

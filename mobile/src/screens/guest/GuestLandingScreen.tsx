import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Button } from '../../components/ui/Button';
import { eventsApi } from '../../api';
import type { Event } from '../../api/types';
import { getEventDisplayName, formatDate } from '../../utils/format';
import { useGuestStore } from '../../store/guestStore';
import { useGuestToken } from '../../hooks/useGuestToken';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { goBackInGuestStack } from '../../navigation/guestNavigation';
import type { GuestStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const GUEST_BASE = 'https://dsitesai.com/moiapp/g';

export function GuestLandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const token = useGuestToken();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const isSubmitted = useGuestStore((s) => s.isSubmitted);
  const formLink = `${GUEST_BASE}/${token}/form`;

  const steps = [
    { icon: 'clipboard-outline' as const, title: t('qrStepForm'), sub: t('qrStepFormSub') },
    { icon: 'wallet-outline' as const, title: t('qrStepPay'), sub: t('qrStepPaySub') },
    { icon: 'checkmark-circle-outline' as const, title: t('qrStepSuccess'), sub: t('qrStepSuccessSub') },
    { icon: 'heart-outline' as const, title: t('qrStepThanks'), sub: t('qrStepThanksSub') },
  ];

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (isSubmitted(token)) {
      navigation.replace('PaymentSuccess', { token, transactionId: 'completed', total: 0 });
      return;
    }
    eventsApi.getByGuestToken(token)
      .then((e: Event) => {
        if (e.approval_status !== 'approved' || e.qr_enabled !== 1) {
          navigation.replace('LinkExpired', { token });
        } else {
          setEvent(e);
        }
      })
      .catch(() => navigation.replace('LinkExpired', { token }))
      .finally(() => setLoading(false));
  }, [token]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(formLink);
    Alert.alert(t('copied'), t('linkCopied'));
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!token || !event) {
    return null;
  }

  const eventTitle = getEventDisplayName(event);
  const eventDate = formatDate(event.wedding_date);
  const eventVenue = `${event.venue || ''}${event.city ? `, ${event.city}` : ''}`.trim();
  const hostName = event.creator_name?.split(' ')[0] || '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={eventTitle}
        subtitle={t('guestPaymentPage')}
        onBack={() => goBackInGuestStack(navigation, token, 'exit')}
      />
      <SafeScreen>
        <ScrollView showsVerticalScrollIndicator={false}>
          {event.cover_photo ? (
            <View style={styles.heroWrap}>
              <Image source={{ uri: event.cover_photo }} style={styles.heroImg} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.heroOverlay} />
              <Text style={[styles.heroTitle, { fontSize: fs.lg }]}>{eventTitle}</Text>
            </View>
          ) : (
            <Text style={[styles.titleOnly, { fontSize: fs.xl }]}>{eventTitle}</Text>
          )}

          <View style={styles.metaRow}>
            {hostName ? <Text style={[styles.host, { fontSize: fs.sm }]}>{t('hostedBy')} {hostName}</Text> : null}
            <View style={styles.metaLine}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.meta, { fontSize: fs.sm }]}>{eventDate}</Text>
            </View>
            {eventVenue ? (
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={[styles.meta, { fontSize: fs.sm }]}>{eventVenue}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.qrCard}>
            <View style={styles.qrIconWrap}>
              <Ionicons name="gift-outline" size={28} color={colors.gold} />
            </View>
            <Text style={[styles.qrTitle, { fontSize: fs.lg }]}>{t('scanToSendMoi')}</Text>
            <Text style={[styles.qrSub, { fontSize: fs.sm }]}>{t('scanQrSub')}</Text>
            <View style={styles.qrWrap}>
              <QRCode value={formLink} size={168} />
            </View>
            <Text style={[styles.orText, { fontSize: fs.xs }]}>{t('orDivider')}</Text>
            <Text style={[styles.linkHint, { fontSize: fs.xs }]}>{t('openInBrowser')}</Text>
            <TouchableOpacity style={styles.linkRow} onPress={copyLink} activeOpacity={0.85}>
              <Text style={[styles.linkText, { fontSize: fs.xs }]} numberOfLines={1}>{formLink}</Text>
              <Text style={[styles.copyBtn, { fontSize: fs.xs }]}>{t('copyLink')}</Text>
            </TouchableOpacity>
            <Text style={[styles.uniqueNote, { fontSize: 10 }]}>{t('linkUniqueNote')}</Text>
          </View>

          <Text style={[styles.howTitle, { fontSize: fs.sm }]}>{t('howItWorks')}</Text>
          <View style={styles.stepsGrid}>
            {steps.map((s) => (
              <View key={s.title} style={styles.stepItem}>
                <Ionicons name={s.icon} size={18} color={colors.gold} />
                <Text style={[styles.stepTitle, { fontSize: 9 }]}>{s.title}</Text>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
            ))}
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.trustTitle, { fontSize: fs.xs }]}>{t('secureTrusted')}</Text>
                <Text style={styles.trustSub}>{t('secureTrustedSub')}</Text>
              </View>
            </View>
            <View style={styles.trustBox}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.trustTitle, { fontSize: fs.xs }]}>{t('encryptedPayments')}</Text>
                <Text style={styles.trustSub}>{t('encryptedPaymentsSub')}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.footerHelp, { fontSize: fs.xs }]}>{t('guestHelpFooter')}</Text>

          <Button title={t('continueToForm')} onPress={() => navigation.navigate('GuestForm', { token })} style={{ marginBottom: spacing.xl }} />
        </ScrollView>
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrap: { height: 140, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroTitle: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md, fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  titleOnly: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  metaRow: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  host: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  qrCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  qrIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qrTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  qrSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  qrWrap: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: '#fff', borderRadius: radius.lg },
  orText: { marginTop: spacing.lg, color: colors.textMuted, fontWeight: '600' },
  linkHint: { color: colors.textSecondary, marginTop: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.sm, width: '100%' },
  linkText: { flex: 1, color: colors.gold, fontWeight: '600' },
  copyBtn: { color: colors.gold, fontWeight: '800' },
  uniqueNote: { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  howTitle: { textAlign: 'center', fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  stepsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stepItem: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  stepTitle: { fontWeight: '800', color: colors.text, marginTop: 4, textAlign: 'center' },
  stepSub: { fontSize: 8, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  trustRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  trustBox: { flex: 1, flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warningBg, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primaryBorder },
  trustTitle: { fontWeight: '800', color: colors.text },
  trustSub: { fontSize: 9, color: colors.textSecondary, marginTop: 2 },
  footerHelp: { textAlign: 'center', color: colors.textMuted, marginBottom: spacing.lg },
});

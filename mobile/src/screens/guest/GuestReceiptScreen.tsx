import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { eventsApi, paymentApi } from '../../api';
import type { Event } from '../../api/types';
import { useGuestStore } from '../../store/guestStore';
import { useGuestToken } from '../../hooks/useGuestToken';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import type { GuestStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function GuestReceiptScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const route = useRoute<RouteProp<GuestStackParamList, 'GuestReceipt'>>();
  const token = useGuestToken();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const { transactionId = '' } = route.params || {};
  const getForm = useGuestStore((s) => s.getForm);
  const getLastOrder = useGuestStore((s) => s.getLastOrder);
  const clearForm = useGuestStore((s) => s.clearForm);

  const guestData = getForm(token);
  const lastOrder = getLastOrder(token);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(!!lastOrder?.razorpayOrderId);
  const [receipt, setReceipt] = useState<{
    guest_name: string;
    amount: number;
    total_amount: number;
    gift_type: string;
    created_at: string;
    event_title: string;
  } | null>(null);

  useEffect(() => {
    eventsApi.getByGuestToken(token).then(setEvent).catch(() => setEvent(null));
    if (lastOrder?.razorpayOrderId) {
      paymentApi.getReceipt(token, lastOrder.razorpayOrderId)
        .then((r) => setReceipt(r.receipt))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, lastOrder?.razorpayOrderId]);

  const copyTxn = async () => {
    await Clipboard.setStringAsync(transactionId);
    alert(t('txnCopied'));
  };

  const displayName = receipt?.guest_name || guestData?.guest_name || 'Guest';
  const amount = receipt?.amount || lastOrder?.amount || Number(guestData?.amount) || 0;
  const total = receipt?.total_amount || lastOrder?.total || amount;
  const giftType = receipt?.gift_type || guestData?.gift_type || 'cash';
  const hostMessage = event?.description?.trim() || t('hostDefaultMessage');

  const buildReceiptText = () =>
    `${t('receiptShareTitle')}\n\n${t('nameLabel')}: ${displayName}\n${t('giftTypeLabel')}: ${giftType}\n${t('amount')}: ${formatCurrency(amount)}\n${t('totalPaid')}: ${formatCurrency(total)}\n${t('txnId')}: ${transactionId}\n${t('dateTimeLabel')}: ${formatDateTime(receipt?.created_at || new Date().toISOString())}`;

  const handleShare = async () => {
    try {
      await Share.share({ message: buildReceiptText(), title: t('receiptShareTitle') });
    } catch { /* cancelled */ }
  };

  const handleDownload = async () => {
    await handleShare();
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeScreen>
      {event?.cover_photo ? (
        <View style={styles.heroWrap}>
          <Image source={{ uri: event.cover_photo }} style={styles.heroImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.heroOverlay} />
        </View>
      ) : null}

      <View style={styles.hero}>
        <Ionicons name="checkmark-circle" size={56} color={colors.success} />
        <Text style={[styles.thankTitle, { fontSize: fs.xxl }]}>{t('thankYouTitle')}</Text>
        <Text style={[styles.thankSub, { fontSize: fs.md }]}>{t('thankYouDear').replace('{name}', displayName)}</Text>
        <Text style={[styles.thankBody, { fontSize: fs.sm }]}>{t('thankYouContribution')}</Text>
        <Text style={[styles.received, { fontSize: fs.sm }]}>{t('moiReceivedSuccess')}</Text>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <Ionicons name="gift" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { fontSize: fs.md }]}>{t('contributionDetails')}</Text>
        </View>
        {[
          { label: t('nameLabel'), value: displayName },
          { label: t('giftTypeLabel'), value: giftType },
          { label: t('amount'), value: formatCurrency(amount), highlight: true },
          { label: t('txnId'), value: transactionId, copy: true },
          { label: t('dateTimeLabel'), value: formatDateTime(receipt?.created_at || new Date().toISOString()) },
        ].map((d) => (
          <View key={d.label} style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: fs.sm }]}>{d.label}</Text>
            <View style={styles.detailRight}>
              <Text style={[styles.detailValue, { fontSize: fs.sm }, d.highlight && styles.amountValue]}>{d.value}</Text>
              {d.copy ? <TouchableOpacity onPress={copyTxn} hitSlop={8}><Ionicons name="copy-outline" size={14} color={colors.primary} /></TouchableOpacity> : null}
            </View>
          </View>
        ))}
        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.detailLabel, { fontSize: fs.sm }]}>{t('totalPaid')}</Text>
          <Text style={[styles.amountValue, { fontSize: fs.md }]}>{formatCurrency(total)}</Text>
        </View>
      </Card>

      <View style={styles.messageBox}>
        <Text style={[styles.messageTitle, { fontSize: fs.md }]}>{t('messageFromHost')}</Text>
        <Text style={[styles.messageText, { fontSize: fs.sm }]}>{hostMessage}</Text>
      </View>

      <Button title={t('shareConfirmation')} onPress={handleShare} />
      <Button title={t('downloadReceipt')} variant="outline" onPress={handleDownload} style={{ marginTop: spacing.md }} />
      <Button
        title={t('done')}
        variant="outline"
        onPress={() => { clearForm(token); navigation.popToTop(); }}
        style={{ marginTop: spacing.md }}
      />
      <Text style={[styles.footer, { fontSize: fs.sm }]}>{t('receiptFooter')}</Text>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrap: { height: 120, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  thankTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.gold, marginTop: spacing.md },
  thankSub: { fontSize: fontSize.md, color: colors.gold, marginTop: spacing.sm },
  thankBody: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  received: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success, marginTop: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.gold },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  detailRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  amountValue: { color: colors.gold, fontSize: fontSize.md, fontWeight: '800' },
  messageBox: { backgroundColor: colors.primaryLight, padding: spacing.lg, borderRadius: radius.lg, marginVertical: spacing.lg },
  messageTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.gold, marginBottom: spacing.sm },
  messageText: { fontSize: fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  footer: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.xxxl },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useGuestStore } from '../../store/guestStore';
import { useGuestToken } from '../../hooks/useGuestToken';
import { formatCurrency } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { resetToMain, navigateToPublicHome } from '../../navigation/navigationRef';
import { useAuthStore } from '../../store/authStore';
import type { GuestStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function PaymentSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const route = useRoute<RouteProp<GuestStackParamList, 'PaymentSuccess'>>();
  const token = useGuestToken();
  const { t } = useAppSettings();
  const user = useAuthStore((s) => s.user);
  const { transactionId = '', total = 0 } = route.params || {};
  const getForm = useGuestStore((s) => s.getForm);
  const getLastOrder = useGuestStore((s) => s.getLastOrder);
  const markSubmitted = useGuestStore((s) => s.markSubmitted);
  const guestData = getForm(token);
  const lastOrder = getLastOrder(token);
  const amount = lastOrder?.amount ?? (total > 0 ? total - (lastOrder?.fee ?? 9) : Number(guestData?.amount) || 0);
  const fee = lastOrder?.fee ?? Math.max(0, total - amount);

  useEffect(() => {
    if (token) markSubmitted(token);
  }, [token, markSubmitted]);

  const copyTxn = async () => {
    await Clipboard.setStringAsync(transactionId);
    alert(t('txnCopied'));
  };

  const receiptText = () =>
    `${t('paymentSuccessful')}\n${t('txnId')}: ${transactionId}\n${t('giftAmount')}: ${formatCurrency(amount)}\n${t('convenienceFee')}: ${formatCurrency(fee)}\n${t('totalAmount')}: ${formatCurrency(amount + fee)}`;

  const handleDownload = async () => {
    try {
      await Share.share({ message: receiptText(), title: t('receiptShareTitle') });
    } catch { /* cancelled */ }
  };

  const goHome = () => {
    if (user) {
      resetToMain();
      return;
    }
    navigateToPublicHome();
  };

  const nextSteps = [
    { icon: 'mail-outline', text: t('receiptEmail') },
    { icon: 'gift-outline', text: t('moiRecorded') },
    { icon: 'calendar-outline', text: t('hostNotified') },
  ];

  return (
    <SafeScreen>
      <View style={styles.hero}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color={colors.success} />
        </View>
        <Text style={styles.title}>{t('paymentSuccessful')}</Text>
        <Text style={styles.sub}>{t('paymentThanks')}</Text>
        <TouchableOpacity style={styles.txnBadge} onPress={copyTxn}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.txnText}>{t('txnId')}: {transactionId}</Text>
          <Ionicons name="copy-outline" size={14} color={colors.success} />
        </TouchableOpacity>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={styles.cardTitle}>{t('paymentSummary')}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.giftIcon}><Ionicons name="gift-outline" size={20} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.giftTitle}>{t('moiGift')}</Text>
            <Text style={styles.giftSub}>{t('from')}: {guestData?.guest_name || 'Guest'} • {guestData?.gift_type || 'cash'}</Text>
          </View>
        </View>
        <View style={styles.feeRow}><Text>{t('giftAmount')}</Text><Text>{formatCurrency(amount)}</Text></View>
        <View style={styles.feeRow}><Text>{t('convenienceFee')}</Text><Text>{formatCurrency(fee)}</Text></View>
        <View style={[styles.feeRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(amount + fee)}</Text>
        </View>
        <View style={styles.secureBox}>
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text style={styles.secureText}>{t('securePaymentsNote')}</Text>
        </View>
      </Card>

      <Text style={styles.nextTitle}>{t('whatsNext')}</Text>
      {nextSteps.map((s) => (
        <View key={s.text} style={styles.nextRow}>
          <Ionicons name={s.icon as never} size={18} color={colors.primary} />
          <Text style={styles.nextText}>{s.text}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      ))}

      <Button title={t('viewReceipt')} onPress={() => navigation.navigate('GuestReceipt', { token, transactionId })} style={{ marginTop: spacing.xl }} />
      <Button title={t('downloadReceipt')} variant="outline" onPress={handleDownload} style={{ marginTop: spacing.md }} />
      <Button title={t('backToHome')} variant="outline" onPress={goHome} style={{ marginTop: spacing.md }} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  txnBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successBg, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, marginTop: spacing.md },
  txnText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  giftIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  giftTitle: { fontWeight: '700', fontSize: fontSize.sm },
  giftSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gold },
  secureBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  secureText: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
  nextTitle: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.md },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm },
  nextText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
});

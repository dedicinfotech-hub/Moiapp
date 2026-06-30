import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { eventsApi, moiApi, paymentApi } from '../../api';
import type { Event } from '../../api/types';
import type { RazorpayPaymentMethod } from '../../api/types';
import { useGuestStore, calcPaymentFee } from '../../store/guestStore';
import { useGuestToken } from '../../hooks/useGuestToken';
import { formatCurrency, getEventDisplayName } from '../../utils/format';
import { openRazorpayCheckout } from '../../utils/razorpay';
import { useAppSettings } from '../../context/AppSettingsContext';
import { goBackInGuestStack } from '../../navigation/guestNavigation';
import type { GuestStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const METHODS: { id: RazorpayPaymentMethod; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'upi', title: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: 'phone-portrait-outline' },
  { id: 'card', title: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay', icon: 'card-outline' },
  { id: 'netbanking', title: 'Net Banking', sub: 'All major banks', icon: 'business-outline' },
  { id: 'wallet', title: 'Wallets', sub: 'Paytm, Mobikwik', icon: 'wallet-outline' },
  { id: 'scan', title: 'Scan & Pay', sub: 'Pay host UPI directly', icon: 'qr-code-outline' },
];

export function GuestPaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const token = useGuestToken();
  const getForm = useGuestStore((s) => s.getForm);
  const setLastOrder = useGuestStore((s) => s.setLastOrder);
  const { t } = useAppSettings();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<RazorpayPaymentMethod>('upi');
  const [scanRef, setScanRef] = useState('');

  const guestData = getForm(token);

  useEffect(() => {
    if (!guestData) {
      navigation.replace('GuestForm', { token });
      return;
    }
    eventsApi.getByGuestToken(token)
      .then((data) => {
        if (data.approval_status !== 'approved' || data.qr_enabled !== 1) {
          navigation.replace('LinkExpired', { token });
        } else {
          setEvent(data);
        }
      })
      .catch(() => navigation.replace('LinkExpired', { token }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || !guestData) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const amount = Number(guestData.amount) || 0;
  const fee = calcPaymentFee(amount);
  const total = amount + fee;
  const isCash = guestData.gift_type === 'cash';

  const handleScanPay = async () => {
    if (!event || !scanRef.trim()) {
      setError(t('enterUpiRef'));
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const note = [guestData.note?.trim(), event.upi_id ? `Scan & Pay UPI: ${event.upi_id}` : '', `UPI Ref: ${scanRef.trim()}`].filter(Boolean).join(' · ');
      await moiApi.add({
        guest_token: token,
        guest_name: guestData.guest_name.trim(),
        phone: guestData.phone || undefined,
        city: guestData.city || undefined,
        company: guestData.company || undefined,
        occupation: guestData.occupation || undefined,
        gift_type: guestData.gift_type,
        amount,
        relation: guestData.relation as 'friend',
        payment_mode: 'upi',
        upi_ref_id: scanRef.trim(),
        other_payment_details: event.upi_id,
        note,
        entered_by: 'guest',
      });
      const txnId = `TXN${Date.now()}`;
      setLastOrder(token, { razorpayOrderId: '', transactionId: txnId, total: amount, amount, fee: 0 });
      navigation.replace('PaymentSuccess', { token, transactionId: txnId, total: amount });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPay = async () => {
    if (!isCash) {
      setError(t('onlineCashOnly'));
      return;
    }
    if (amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const order = await paymentApi.createOrder({
        guest_token: token,
        payment_method: method,
        guest_data: {
          guest_name: guestData.guest_name.trim(),
          phone: guestData.phone || undefined,
          email: guestData.email || undefined,
          city: guestData.city || undefined,
          company: guestData.company || undefined,
          occupation: guestData.occupation || undefined,
          relation: guestData.relation as 'friend',
          gift_type: guestData.gift_type,
          amount,
          note: guestData.note || undefined,
        },
      });

      await openRazorpayCheckout(
        order,
        async (response) => {
          try {
            const result = await paymentApi.verifyPayment({
              guest_token: token,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: method,
            });
            setLastOrder(token, {
              razorpayOrderId: response.razorpay_order_id,
              transactionId: result.transaction_id,
              total: result.total_amount,
              amount: result.amount,
              fee: result.fee,
            });
            navigation.replace('PaymentSuccess', {
              token,
              transactionId: result.transaction_id,
              total: result.total_amount,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        (msg) => {
          if (Platform.OS !== 'web') {
            Alert.alert('Complete in Browser', msg);
          } else {
            setError(msg);
          }
          setProcessing(false);
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start payment');
      setProcessing(false);
    }
  };

  const handlePay = () => {
    if (method === 'scan') handleScanPay();
    else handleRazorpayPay();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('paymentTitle')}
        subtitle={event ? getEventDisplayName(event) : ''}
        onBack={() => goBackInGuestStack(navigation, token, 'form')}
        rightElement={<Text style={styles.secure}>🔒 {t('secure')}</Text>}
      />
      <SafeScreen>
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.summaryRow}>
            <View style={styles.giftIcon}><Ionicons name="gift-outline" size={24} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.giftTitle}>{t('moiGift')}</Text>
              <Text style={styles.giftSub}>{t('from')}: {guestData.guest_name} • {guestData.gift_type}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('GuestForm', { token })}>
              <Text style={styles.edit}>Edit ›</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bigAmount}>{formatCurrency(amount)}</Text>
        </Card>

        <Text style={styles.section}>{t('selectPaymentMethod')}</Text>
        {METHODS.map((m) => (
          <TouchableOpacity key={m.id} onPress={() => setMethod(m.id)} style={[styles.methodCard, method === m.id && styles.methodActive]}>
            <Ionicons name={m.icon} size={24} color={method === m.id ? colors.primary : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>{m.title}</Text>
              <Text style={styles.methodSub}>{m.sub}</Text>
            </View>
            <View style={[styles.radio, method === m.id && styles.radioActive]} />
          </TouchableOpacity>
        ))}

        {method === 'scan' && (
          <>
            {event?.upi_id ? (
              <View style={styles.upiBox}>
                <Text style={styles.upiLabel}>Pay to host UPI:</Text>
                <Text style={styles.upiId}>{event.upi_id}</Text>
              </View>
            ) : (
              <Text style={styles.error}>Host has not added UPI ID. Use another method.</Text>
            )}
            <Input label="UPI Reference / Transaction ID" icon="document-text-outline" placeholder="Enter ref after payment" value={scanRef} onChangeText={setScanRef} />
          </>
        )}

        <View style={styles.secureBanner}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={styles.secureBannerText}>100% Secure Payments</Text>
        </View>

        <Card>
          <View style={styles.feeRow}><Text>{t('giftAmount')}</Text><Text>{formatCurrency(amount)}</Text></View>
          {method !== 'scan' && <View style={styles.feeRow}><Text>{t('convenienceFee')}</Text><Text>{formatCurrency(fee)}</Text></View>}
          <View style={[styles.feeRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
            <Text style={styles.totalValue}>{formatCurrency(method === 'scan' ? amount : total)}</Text>
          </View>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title={`Pay ${formatCurrency(method === 'scan' ? amount : total)}`} onPress={handlePay} loading={processing} />
        <Text style={styles.razorpay}>{method === 'scan' ? 'Direct UPI to host' : 'Secured by Razorpay'}</Text>
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  secure: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  giftIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  giftTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  giftSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  edit: { color: colors.primary, fontSize: fontSize.sm },
  bigAmount: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.blue, marginTop: spacing.md },
  section: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, backgroundColor: colors.surface },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  methodSub: { fontSize: fontSize.xs, color: colors.textMuted },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  secureBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginVertical: spacing.lg },
  secureBannerText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.blue },
  razorpay: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.md },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: 'center' },
  upiBox: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  upiLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  upiId: { fontSize: fontSize.md, fontWeight: '700', color: colors.gold, marginTop: 4 },
});

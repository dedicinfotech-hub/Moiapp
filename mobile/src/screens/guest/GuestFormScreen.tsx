import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Input } from '../../components/ui/Input';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/forms/StepIndicator';
import { SelectChips, RELATION_OPTIONS } from '../../components/forms/SelectChips';
import { eventsApi, moiApi } from '../../api';
import { useGuestStore } from '../../store/guestStore';
import { useGuestToken } from '../../hooks/useGuestToken';
import { useAppSettings } from '../../context/AppSettingsContext';
import { goBackInGuestStack } from '../../navigation/guestNavigation';
import { getEventDisplayName } from '../../utils/format';
import type { GuestFormData, GuestStackParamList } from '../../navigation/types';
import type { MoiEntry } from '../../api/types';
import { colors, fontSize, spacing } from '../../theme';

type GiftType = GuestFormData['gift_type'];
type WeightUnit = GuestFormData['gold_unit'];

function toGrams(value: string, unit: WeightUnit): number {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n <= 0) return 0;
  return unit === 'lb' ? n * 453.592 : n;
}

function emptyForm(existing: GuestFormData | null): Omit<GuestFormData, 'gift_type'> {
  return {
    guest_name: existing?.guest_name || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    city: existing?.city || '',
    relation: existing?.relation || 'friend',
    company: existing?.company || '',
    occupation: existing?.occupation || '',
    amount: existing?.amount || '',
    gold_weight: existing?.gold_weight || '',
    gold_unit: existing?.gold_unit || 'g',
    silver_weight: existing?.silver_weight || '',
    silver_unit: existing?.silver_unit || 'g',
    gift_description: existing?.gift_description || '',
    note: existing?.note || '',
  };
}

export function GuestFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const token = useGuestToken();
  const { t } = useAppSettings();
  const saveGuestForm = useGuestStore((s) => s.setForm);
  const markSubmitted = useGuestStore((s) => s.markSubmitted);
  const setLastOrder = useGuestStore((s) => s.setLastOrder);
  const existing = useGuestStore((s) => s.getForm(token));

  const [step, setStep] = useState(1);
  const [eventTitle, setEventTitle] = useState('');
  const [giftType, setGiftType] = useState<GiftType>(existing?.gift_type || 'cash');
  const [form, setFormState] = useState(emptyForm(existing));
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (useGuestStore.getState().isSubmitted(token)) {
      navigation.replace('PaymentSuccess', { token, transactionId: 'completed', total: 0 });
      return;
    }
    eventsApi.getByGuestToken(token)
      .then((e) => setEventTitle(getEventDisplayName(e)))
      .catch(() => {});
  }, [token]);

  const update = (k: string, v: string) => setFormState((p) => ({ ...p, [k]: v }));

  const giftTypes: { id: GiftType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'cash', label: t('cash'), icon: 'cash-outline' },
    { id: 'gold', label: t('gold'), icon: 'diamond-outline' },
    { id: 'silver', label: t('silver'), icon: 'ellipse-outline' },
    { id: 'gift', label: t('others'), icon: 'gift-outline' },
  ];

  const stepLabels = [t('guestFormStepPersonal'), t('guestFormStepGift'), t('guestFormStepMessage')];

  const validateStep1 = () => {
    if (!form.guest_name.trim()) {
      Alert.alert(t('error'), t('fullNameRequired'));
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      Alert.alert(t('error'), t('validMobileRequired'));
      return false;
    }
    if (!form.city.trim()) {
      Alert.alert(t('error'), t('cityRequired'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (giftType === 'cash') {
      const amount = parseFloat(form.amount);
      if (!form.amount.trim() || Number.isNaN(amount) || amount <= 0) {
        Alert.alert(t('error'), t('validAmountRequired'));
        return false;
      }
      return true;
    }
    if (giftType === 'gold') {
      if (!toGrams(form.gold_weight, form.gold_unit)) {
        Alert.alert(t('error'), t('goldWeightRequired'));
        return false;
      }
      return true;
    }
    if (giftType === 'silver') {
      if (!toGrams(form.silver_weight, form.silver_unit)) {
        Alert.alert(t('error'), t('silverWeightRequired'));
        return false;
      }
      return true;
    }
    if (!form.gift_description.trim()) {
      Alert.alert(t('error'), t('customGiftRequired'));
      return false;
    }
    return true;
  };

  const buildPayload = (): GuestFormData => ({
    ...form,
    guest_name: form.guest_name.trim(),
    phone: form.phone.trim(),
    city: form.city.trim(),
    relation: form.relation.trim() || 'other',
    gift_type: giftType,
  });

  const recordNonCashGift = async (payload: GuestFormData) => {
    const goldWeight =
      giftType === 'gold'
        ? toGrams(payload.gold_weight, payload.gold_unit)
        : giftType === 'silver'
        ? toGrams(payload.silver_weight, payload.silver_unit)
        : undefined;

    await moiApi.add({
      guest_token: token,
      guest_name: payload.guest_name,
      phone: payload.phone,
      city: payload.city,
      company: payload.company || undefined,
      occupation: payload.occupation || undefined,
      gift_type: giftType,
      amount: giftType === 'gift' && payload.amount ? parseFloat(payload.amount) || 0 : 0,
      gold_weight: goldWeight,
      gift_description: giftType === 'gift' ? payload.gift_description.trim() : undefined,
      relation: (payload.relation || 'other') as MoiEntry['relation'],
      payment_mode: 'other',
      note: payload.note?.trim() || undefined,
      entered_by: 'guest',
    });

    const txnId = `TXN${Date.now()}`;
    markSubmitted(token);
    setLastOrder(token, { razorpayOrderId: '', transactionId: txnId, total: 0, amount: 0, fee: 0 });
    navigation.replace('PaymentSuccess', { token, transactionId: txnId, total: 0 });
  };

  const submit = async () => {
    const payload = buildPayload();
    if (giftType === 'cash') {
      saveGuestForm(token, payload);
      navigation.navigate('GuestPayment', { token });
      return;
    }
    setSubmitting(true);
    try {
      await recordNonCashGift(payload);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep(step + 1);
    else submit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else goBackInGuestStack(navigation, token, 'landing');
  };

  const renderUnitToggle = (
    unit: WeightUnit,
    onUnit: (u: WeightUnit) => void,
  ) => (
    <View style={styles.unitRow}>
      {(['g', 'lb'] as WeightUnit[]).map((u) => (
        <TouchableOpacity
          key={u}
          onPress={() => onUnit(u)}
          style={[styles.unitChip, unit === u && styles.unitChipActive]}
        >
          <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
            {u === 'g' ? t('weightUnitGrams') : t('weightUnitPounds')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('guestMoiForm')} subtitle={eventTitle} onBack={handleBack} />
      <SafeScreen>
        <StepIndicator current={step} steps={stepLabels} />
        {step === 1 ? <InfoBanner message={t('guestPersonalRequiredHint')} /> : null}

        {step === 1 ? (
          <>
            <Text style={styles.section}>{t('guestPersonalDetails')}</Text>
            <Input label={t('lblFullName')} icon="person-outline" placeholder={t('phFullName')} value={form.guest_name} onChangeText={(v) => update('guest_name', v)} required />
            <Input label={t('lblMobile')} icon="call-outline" placeholder={t('phMobile')} value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" maxLength={10} required />
            <Input label={t('lblEmailOptional')} icon="mail-outline" placeholder={t('phEmail')} value={form.email} onChangeText={(v) => update('email', v)} />
            <Input label={t('lblCity')} icon="business-outline" placeholder={t('phCity')} value={form.city} onChangeText={(v) => update('city', v)} required />
            <SelectChips label={t('relationOptional')} options={RELATION_OPTIONS} value={form.relation as typeof RELATION_OPTIONS[number]['value']} onChange={(v) => update('relation', v)} />
            <Input label={t('lblCompanyOptional')} icon="briefcase-outline" placeholder={t('phCompany')} value={form.company} onChangeText={(v) => update('company', v)} />
            <Input label={t('lblOccupationOptional')} icon="id-card-outline" placeholder={t('phOccupation')} value={form.occupation} onChangeText={(v) => update('occupation', v)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.section}>{t('guestGiftDetails')}</Text>
            <View style={styles.giftRow}>
              {giftTypes.map((g) => (
                <TouchableOpacity key={g.id} onPress={() => setGiftType(g.id)} style={[styles.giftChip, giftType === g.id && styles.giftChipActive]}>
                  <Ionicons name={g.icon} size={20} color={giftType === g.id ? colors.primary : colors.textMuted} />
                  <Text style={[styles.giftLabel, giftType === g.id && styles.giftLabelActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {giftType === 'cash' ? (
              <Input label={t('amount')} icon="cash-outline" placeholder={t('phAmount')} value={form.amount} onChangeText={(v) => update('amount', v)} keyboardType="numeric" required />
            ) : null}

            {giftType === 'gold' ? (
              <>
                <Input label={t('goldWeight')} icon="diamond-outline" placeholder={t('phGoldWeight')} value={form.gold_weight} onChangeText={(v) => update('gold_weight', v)} keyboardType="decimal-pad" required />
                {renderUnitToggle(form.gold_unit, (u) => update('gold_unit', u))}
              </>
            ) : null}

            {giftType === 'silver' ? (
              <>
                <Input label={t('silverWeight')} icon="ellipse-outline" placeholder={t('phSilverWeight')} value={form.silver_weight} onChangeText={(v) => update('silver_weight', v)} keyboardType="decimal-pad" required />
                {renderUnitToggle(form.silver_unit, (u) => update('silver_unit', u))}
              </>
            ) : null}

            {giftType === 'gift' ? (
              <>
                <Input label={t('customGift')} icon="gift-outline" placeholder={t('phCustomGift')} value={form.gift_description} onChangeText={(v) => update('gift_description', v)} required />
                <Input label={t('approxValueOptional')} icon="cash-outline" placeholder={t('phAmount')} value={form.amount} onChangeText={(v) => update('amount', v)} keyboardType="numeric" />
              </>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.section}>{t('guestFormStepMessage')}</Text>
            <Input label={t('guestFormStepMessage')} icon="chatbox-outline" placeholder={t('phGuestMessage')} value={form.note} onChangeText={(v) => update('note', v)} multiline maxLength={200} />
            <View style={styles.secureBox}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} />
              <Text style={styles.secureText}>{t('guestPrivacyNote')}</Text>
            </View>
          </>
        ) : null}

        <Button
          title={step < 3 ? t('continue') : giftType === 'cash' ? t('payNow') : t('submitGift')}
          onPress={handleNext}
          loading={submitting}
          style={{ marginTop: spacing.lg }}
        />
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.md },
  giftRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  giftChip: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  giftChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  giftLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  giftLabelActive: { color: colors.gold },
  unitRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  unitChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  unitChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  unitChipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  unitChipTextActive: { color: colors.text, fontWeight: '800' },
  secureBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 12, marginVertical: spacing.lg },
  secureText: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
});

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
import { eventsApi } from '../../api';
import { useGuestStore } from '../../store/guestStore';
import { useGuestToken } from '../../hooks/useGuestToken';
import { useAppSettings } from '../../context/AppSettingsContext';
import { goBackInGuestStack } from '../../navigation/guestNavigation';
import { getEventDisplayName } from '../../utils/format';
import type { GuestFormData, GuestStackParamList } from '../../navigation/types';
import { colors, fontSize, spacing } from '../../theme';

type GiftType = GuestFormData['gift_type'];

export function GuestFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const token = useGuestToken();
  const { t } = useAppSettings();
  const saveGuestForm = useGuestStore((s) => s.setForm);
  const existing = useGuestStore((s) => s.getForm(token));

  const [step, setStep] = useState(1);
  const [eventTitle, setEventTitle] = useState('');
  const [giftType, setGiftType] = useState<GiftType>(existing?.gift_type || 'cash');
  const [form, setFormState] = useState({
    guest_name: existing?.guest_name || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    city: existing?.city || '',
    relation: existing?.relation || 'friend',
    company: existing?.company || '',
    occupation: existing?.occupation || '',
    amount: existing?.amount || '',
    note: existing?.note || '',
  });

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

  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!form.amount.trim() || Number.isNaN(amount) || amount <= 0) {
      Alert.alert(t('error'), t('validAmountRequired'));
      return;
    }
    const payload: GuestFormData = {
      ...form,
      guest_name: form.guest_name.trim() || 'Guest',
      phone: form.phone.trim() || '',
      city: form.city.trim() || '',
      relation: form.relation.trim() || 'other',
      gift_type: giftType,
    };
    saveGuestForm(token, payload);
    navigation.navigate('GuestPayment', { token });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else submit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else goBackInGuestStack(navigation, token, 'landing');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('guestMoiForm')}
        subtitle={eventTitle}
        onBack={handleBack}
      />
      <SafeScreen>
        <StepIndicator current={step} steps={stepLabels} />
        {step === 1 ? <InfoBanner message={t('guestAmountOnlyHint')} /> : null}

        {step === 1 ? (
          <>
            <Text style={styles.section}>{t('guestPersonalDetails')}</Text>
            <Input label={t('lblFullNameOptional')} icon="person-outline" placeholder={t('phFullName')} value={form.guest_name} onChangeText={(v) => update('guest_name', v)} />
            <Input label={t('lblMobileOptional')} icon="call-outline" placeholder={t('phMobile')} value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" maxLength={10} />
            <Input label={t('lblEmailOptional')} icon="mail-outline" placeholder={t('phEmail')} value={form.email} onChangeText={(v) => update('email', v)} />
            <Input label={t('lblCityOptional')} icon="business-outline" placeholder={t('phCity')} value={form.city} onChangeText={(v) => update('city', v)} />
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
            <Input label={t('amount')} icon="cash-outline" placeholder={t('phAmount')} value={form.amount} onChangeText={(v) => update('amount', v)} keyboardType="numeric" required />
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
          title={step < 3 ? t('continue') : t('payNow')}
          onPress={handleNext}
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
  secureBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 12, marginVertical: spacing.lg },
  secureText: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
});

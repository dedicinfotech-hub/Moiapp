import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { MoreStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { user, setUser } = useAuthStore();
  const { t } = useAppSettings();

  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiId, setUpiId] = useState(user?.upi_id || '');
  const [bankName, setBankName] = useState(user?.bank_name || '');
  const [accountHolder, setAccountHolder] = useState(user?.account_holder || '');
  const [accountNumber, setAccountNumber] = useState(user?.account_number || '');
  const [ifscCode, setIfscCode] = useState(user?.ifsc_code || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setCity(user.city || '');
    setPhone(user.phone || '');
    setUpiId(user.upi_id || '');
    setBankName(user.bank_name || '');
    setAccountHolder(user.account_holder || '');
    setAccountNumber(user.account_number || '');
    setIfscCode(user.ifsc_code || '');
  }, [user?.id]);

  const hasPaymentDetails = Boolean(upiId.trim() || accountNumber.trim());

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('profileNameRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        city: city.trim(),
        phone: phone.trim(),
        upi_id: upiId.trim(),
        bank_name: bankName.trim(),
        account_holder: accountHolder.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
      });
      setUser(res.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('profileSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('profile')} onBack={() => navigation.goBack()} />
      <SafeScreen>
        <Card style={styles.card} padding={0}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profileDetails')}</Text>
            <Text style={styles.sectionSub}>{t('profileDetailsSub')}</Text>
          </View>
          <View style={styles.cardBody}>
            {saved ? <InfoBanner message={t('profileSaved')} variant="success" /> : null}
            {error ? <InfoBanner message={error} variant="warning" /> : null}

            <Input label={t('lblDisplayName')} icon="person-outline" value={name} onChangeText={setName} required />
            <Input label={t('lblCity')} icon="business-outline" placeholder={t('phCity')} value={city} onChangeText={setCity} required />
            <Input
              label={t('lblMobile')}
              icon="call-outline"
              placeholder={t('phMobile')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              required
            />
            <Input label={t('lblEmailOptional')} icon="mail-outline" value={user?.email || ''} editable={false} />
            <Text style={styles.fieldHint}>{t('emailCannotChange')}</Text>

            <View style={styles.paymentHeader}>
              <View style={styles.paymentTitleRow}>
                <Ionicons name="wallet-outline" size={16} color={colors.text} />
                <Text style={styles.paymentTitle}>{t('paymentDetails')}</Text>
                {hasPaymentDetails ? (
                  <View style={styles.savedBadge}>
                    <Text style={styles.savedBadgeText}>{t('saved')}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.paymentDesc}>{t('paymentDetailsSub')}</Text>
            </View>

            <Input label={t('lblUpiId')} icon="wallet-outline" placeholder="yourname@upi" value={upiId} onChangeText={setUpiId} />

            <View style={styles.bankBox}>
              <Text style={styles.bankBoxTitle}>{t('bankAccountOptional')}</Text>
              <Input label={t('lblAccountHolder')} placeholder={t('phAccountHolder')} value={accountHolder} onChangeText={setAccountHolder} />
              <Input label={t('lblBankName')} placeholder={t('phBankName')} value={bankName} onChangeText={setBankName} />
              <Input label={t('lblAccountNumber')} placeholder="XXXXXXXXXXXX" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
              <Input label={t('lblIfsc')} placeholder="SBIN0001234" value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" />
            </View>

            <Button title={loading ? t('saving') : t('saveChanges')} onPress={handleSave} loading={loading} />
          </View>
        </Card>
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg, overflow: 'hidden' },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  cardBody: { padding: spacing.lg },
  fieldHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.md },
  paymentHeader: { marginTop: spacing.sm, marginBottom: spacing.md },
  paymentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  paymentTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, flex: 1 },
  savedBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  savedBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  paymentDesc: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },
  bankBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bankBoxTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
});

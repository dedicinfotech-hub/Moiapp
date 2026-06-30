import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { InfoBanner } from '../../components/ui/InfoBanner';
import {
  SettingsInfoRow,
  SettingsSelectRow,
  SettingsToggleRow,
} from '../../components/settings/SettingsRows';
import { useAuthStore } from '../../store/authStore';
import { authApi, eventsApi, returnGiftsApi } from '../../api';
import { useAppSettings } from '../../context/AppSettingsContext';
import { scheduleEventReminders } from '../../services/localNotifications';
import {
  loadAppSettings,
  type AppFontSize,
  type AppLanguage,
  type AppSettings,
} from '../../utils/settingsStorage';
import type { MoreStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { user, logout, setUser } = useAuthStore();
  const { t, updateSettings: patchContextSettings } = useAppSettings();

  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiId, setUpiId] = useState(user?.upi_id || '');
  const [bankName, setBankName] = useState(user?.bank_name || '');
  const [accountHolder, setAccountHolder] = useState(user?.account_holder || '');
  const [accountNumber, setAccountNumber] = useState(user?.account_number || '');
  const [ifscCode, setIfscCode] = useState(user?.ifsc_code || '');

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    loadAppSettings().then(setAppSettings);
  }, []);

  const patchAppSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await patchContextSettings(partial);
    setAppSettings(next);
    if (
      partial.notificationsEnabled !== undefined ||
      partial.notifFunctionReminder !== undefined ||
      partial.notifFunctionToday !== undefined ||
      partial.notifReturnGift !== undefined ||
      partial.notifReturnGift !== undefined ||
      partial.notifTime !== undefined
    ) {
      Promise.all([
        eventsApi.list(),
        returnGiftsApi.listOverdue().catch(() => ({ overdue: [] })),
      ])
        .then(([ev, od]) => scheduleEventReminders(ev, next, od.overdue || []))
        .catch(() => {});
    }
  }, [patchContextSettings]);

  const hasPaymentDetails = Boolean(upiId.trim() || accountNumber.trim());

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('Display name is required');
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
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = () => setShowDeleteConfirm(true);

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await authApi.deleteAccount();
      setShowDeleteConfirm(false);
      await logout();
      Alert.alert('Account Scheduled', res.message);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!appSettings) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t('settings')} onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('settings')} onBack={() => navigation.goBack()} />
      <SafeScreen>
        {/* Profile */}
        <Card style={styles.card} padding={0}>
          <SectionHeader title="Profile" subtitle="Your name and contact details" />
          <View style={styles.cardBody}>
            {saved ? <InfoBanner message="Changes saved" variant="success" /> : null}
            {error ? <InfoBanner message={error} variant="warning" /> : null}

            <Input label="Display Name" icon="person-outline" value={name} onChangeText={setName} required />
            <Input label="City" icon="business-outline" placeholder="Your city" value={city} onChangeText={setCity} />
            <Input
              label="Phone"
              icon="call-outline"
              placeholder="+91 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input label="Email" icon="mail-outline" value={user?.email || ''} editable={false} />
            <Text style={styles.fieldHint}>Email cannot be changed</Text>

            <View style={styles.paymentHeader}>
              <View style={styles.paymentTitleRow}>
                <Ionicons name="wallet-outline" size={16} color={colors.text} />
                <Text style={styles.paymentTitle}>Payment Details</Text>
                {hasPaymentDetails ? (
                  <View style={styles.savedBadge}>
                    <Text style={styles.savedBadgeText}>Saved</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.paymentDesc}>
                Add your UPI ID or bank account so guests know where to transfer moi. The UPI ID is used for Scan & Pay on guest payment pages.
              </Text>
            </View>

            <Input label="UPI ID" icon="wallet-outline" placeholder="yourname@upi" value={upiId} onChangeText={setUpiId} />

            <View style={styles.bankBox}>
              <Text style={styles.bankBoxTitle}>Bank Account (optional)</Text>
              <Input label="Account Holder Name" placeholder="As per bank records" value={accountHolder} onChangeText={setAccountHolder} />
              <Input label="Bank Name" placeholder="SBI / HDFC / etc." value={bankName} onChangeText={setBankName} />
              <Input label="Account Number" placeholder="XXXXXXXXXXXX" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
              <Input label="IFSC Code" placeholder="SBIN0001234" value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>How moi transfer works</Text>
              <Text style={styles.infoBullet}>• Guests who pay UPI / online — transfer directly to your UPI ID shown on the event page</Text>
              <Text style={styles.infoBullet}>• Guests who pay cash — hand it over in person; you record it manually in the dashboard</Text>
              <Text style={styles.infoBullet}>• Guests who pay bank transfer — use the account number above</Text>
              <Text style={styles.infoBullet}>• MoiApp does not hold or process any money — all transfers go directly to you</Text>
            </View>

            <Button title={loading ? 'Saving…' : 'Save Changes'} onPress={handleSaveProfile} loading={loading} />
          </View>
        </Card>

        {/* App Settings */}
        <Card style={styles.card} padding={0}>
          <SectionHeader title="App Settings" subtitle="Customize your app experience" />
          <View style={styles.cardBody}>
            <SettingsToggleRow
              title="Notifications"
              subtitle="Master switch for all notifications"
              value={appSettings.notificationsEnabled}
              onValueChange={(v) => patchAppSettings({ notificationsEnabled: v })}
            />

            {appSettings.notificationsEnabled ? (
              <>
                <SettingsToggleRow
                  title="Function Reminder"
                  subtitle="3 days before function date"
                  value={appSettings.notifFunctionReminder}
                  onValueChange={(v) => patchAppSettings({ notifFunctionReminder: v })}
                />
                <SettingsToggleRow
                  title="Function Day Alert"
                  subtitle="On the day of function"
                  value={appSettings.notifFunctionToday}
                  onValueChange={(v) => patchAppSettings({ notifFunctionToday: v })}
                />
                <SettingsToggleRow
                  title="Return Gift Reminder"
                  subtitle="Weekly reminder for pending returns"
                  value={appSettings.notifReturnGift}
                  onValueChange={(v) => patchAppSettings({ notifReturnGift: v })}
                />
                <SettingsToggleRow
                  title="Entry Save Confirmation"
                  subtitle="Show notification when moi entry is saved"
                  value={appSettings.notifEntrySaved}
                  onValueChange={(v) => patchAppSettings({ notifEntrySaved: v })}
                />
                <Input
                  label="Default Notification Time"
                  icon="time-outline"
                  placeholder="09:00"
                  value={appSettings.notifTime}
                  onChangeText={(v) => patchAppSettings({ notifTime: v })}
                />
              </>
            ) : null}

            <SettingsSelectRow<AppLanguage>
              title={t('language')}
              subtitle="App language preference"
              value={appSettings.language}
              options={[
                { value: 'en', label: 'English' },
                { value: 'ta', label: 'Tamil' },
              ]}
              onChange={(v) => patchAppSettings({ language: v })}
            />

            <SettingsSelectRow<AppFontSize>
              title={t('fontSize')}
              subtitle="Adjust text size for better readability"
              value={appSettings.fontSize}
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ]}
              onChange={(v) => patchAppSettings({ fontSize: v })}
            />
          </View>
        </Card>

        {/* Account */}
        <Card style={styles.card} padding={0}>
          <SectionHeader title="Account" />
          <View style={styles.cardBodyTight}>
            <SettingsInfoRow label="User ID" subtitle="Internal identifier" value={`#${user?.id ?? '—'}`} borderTop={false} />
            <SettingsInfoRow
              label="Plan"
              subtitle="Current subscription"
              value={
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Free</Text>
                </View>
              }
            />
            <SettingsInfoRow label="App Version" subtitle="MoiApp dashboard" value={`v${APP_VERSION}`} />
          </View>
        </Card>

        {/* Danger Zone */}
        <Card style={styles.dangerCardWrap} padding={0}>
          <View style={styles.dangerHeader}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          <View style={styles.dangerBody}>
            <View style={styles.dangerBlock}>
              <Text style={styles.rowTitle}>Sign out</Text>
              <Text style={styles.rowSub}>Log out of your account on this device</Text>
              <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dangerDivider} />
            <View style={styles.dangerBlock}>
              <Text style={[styles.rowTitle, { color: colors.error }]}>Delete Account</Text>
              <Text style={styles.rowSub}>Account will be deleted after 30-day grace period</Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
                <Text style={styles.deleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </SafeScreen>
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete Account"
        message="Your account will be scheduled for deletion. After a 30-day grace period, all your data will be permanently removed."
        confirmText="Confirm Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
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
  cardBodyTight: { paddingHorizontal: spacing.lg },
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
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoBoxTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gold, marginBottom: spacing.sm },
  infoBullet: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  planBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: colors.text },
  dangerCardWrap: { marginBottom: spacing.lg, overflow: 'hidden', borderColor: 'rgba(239, 68, 68, 0.25)' },
  dangerHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.error },
  dangerBody: { padding: spacing.lg, gap: spacing.lg },
  dangerBlock: { gap: spacing.sm },
  dangerDivider: { height: 1, backgroundColor: colors.border },
  signOutBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: colors.errorBg,
  },
  signOutText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.error },
  deleteBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.error,
  },
  deleteText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },
});

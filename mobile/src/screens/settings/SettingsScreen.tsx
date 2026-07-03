import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
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
  const { user, logout } = useAuthStore();
  const { t, updateSettings: patchContextSettings } = useAppSettings();

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleLogout = async () => {
    await logout();
  };

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
        <Card style={styles.linkCard} padding={0}>
          <TouchableOpacity style={styles.profileLink} onPress={() => navigation.navigate('Profile')}>
            <View>
              <Text style={styles.profileLinkTitle}>{t('profile')}</Text>
              <Text style={styles.profileLinkSub}>{t('profileDetailsSub')}</Text>
            </View>
            <Text style={styles.profileLinkArrow}>›</Text>
          </TouchableOpacity>
        </Card>

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
              <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)} activeOpacity={0.85}>
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
  linkCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  profileLinkTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  profileLinkSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  profileLinkArrow: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
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

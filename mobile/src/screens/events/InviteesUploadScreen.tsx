import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useEvent } from '../../hooks/useEvent';
import { useAppSettings } from '../../context/AppSettingsContext';
import { invitationsApi } from '../../api';
import type { Invitation } from '../../api/invitations';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const CSV_TEMPLATE = 'name,phone,relation,city\nRavi Kumar,9876543210,friend,Chennai\nPriya Sharma,9123456789,family,Madurai';
const GUEST_BASE = 'https://dsitesai.com/moiapp/g';

type UploadSummary = { valid: number; invalid: number; total: number; errors: string[] };

export function InviteesUploadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { event } = useEvent(slug);
  const { t } = useAppSettings();
  const [uploading, setUploading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');

  const loadInvitations = useCallback(() => {
    if (!event) return;
    setLoadingList(true);
    invitationsApi.list(event.id)
      .then((r) => setInvitations(r.invitations || []))
      .catch(() => setInvitations([]))
      .finally(() => setLoadingList(false));
  }, [event?.id]);

  React.useEffect(() => { loadInvitations(); }, [loadInvitations]);

  if (!event) return null;

  const guestLink = event.guest_token ? `${GUEST_BASE}/${event.guest_token}/form` : '';

  const downloadTemplate = async () => {
    const fileUri = `${FileSystem.cacheDirectory}invitation-template.csv`;
    await FileSystem.writeAsStringAsync(fileUri, CSV_TEMPLATE);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: t('downloadTemplate') });
    }
  };

  const pickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setError('');
    setUploadSummary(null);
    try {
      const res = await invitationsApi.uploadCsv(event.id, {
        uri: asset.uri,
        name: asset.name || 'invitees.csv',
        type: asset.mimeType || 'text/csv',
      });
      setUploadSummary({
        valid: res.valid ?? res.count,
        invalid: res.invalid ?? 0,
        total: res.total ?? res.count,
        errors: res.errors ?? [],
      });
      loadInvitations();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setUploading(false);
    }
  };

  const openWhatsApp = () => {
    if (!guestLink) return;
    const text = `${event.custom_title || 'Our event'} — ${guestLink}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const quickActions = [
    { icon: 'logo-whatsapp' as const, label: t('inviteQuickWhatsapp'), onPress: openWhatsApp, color: '#25D366' },
    { icon: 'chatbubble-outline' as const, label: t('inviteQuickSms'), onPress: () => guestLink && Linking.openURL(`sms:?body=${encodeURIComponent(guestLink)}`), color: colors.blue },
    { icon: 'mail-outline' as const, label: t('inviteQuickEmail'), onPress: () => guestLink && Linking.openURL(`mailto:?body=${encodeURIComponent(guestLink)}`), color: colors.warning },
    { icon: 'qr-code-outline' as const, label: t('inviteQuickQr'), onPress: () => navigation.navigate('QRCode', { slug }), color: colors.gold },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('inviteesUploadTitle')} onBack={() => navigation.goBack()} />
      <SafeScreen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.desc}>{t('inviteesUploadDesc')}</Text>
          <EventContextCard event={event} />

          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={styles.cardTitle}>{t('uploadGuestList')}</Text>
            <Text style={styles.cardSub}>{t('supportedCsv')}</Text>
            <Button title={t('downloadTemplate')} variant="outline" onPress={downloadTemplate} style={{ marginBottom: spacing.md }} />

            <TouchableOpacity style={styles.dropZone} onPress={pickAndUpload} disabled={uploading} activeOpacity={0.85}>
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.dropTitle}>{t('dragDropUpload')}</Text>
                  <Text style={styles.dropSub}>{t('dragDropHint')}</Text>
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Card>

          {uploadSummary ? (
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={styles.cardTitle}>{t('uploadSummary')}</Text>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryBox, styles.summaryValid]}>
                  <Text style={styles.summaryNum}>{uploadSummary.valid}</Text>
                  <Text style={styles.summaryLbl}>{t('validRecords')}</Text>
                </View>
                <View style={[styles.summaryBox, styles.summaryInvalid]}>
                  <Text style={[styles.summaryNum, { color: colors.error }]}>{uploadSummary.invalid}</Text>
                  <Text style={styles.summaryLbl}>{t('invalidRecords')}</Text>
                </View>
              </View>
              <Text style={styles.totalNote}>{t('totalRecords')}: {uploadSummary.total}</Text>
              {uploadSummary.errors.length > 0 ? (
                <View style={styles.errorReport}>
                  <Text style={styles.errorReportTitle}>{t('errorReport')}</Text>
                  {uploadSummary.errors.map((err) => (
                    <Text key={err} style={styles.errorLine}>• {err}</Text>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}

          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={styles.cardTitle}>{t('invitationOptions')}</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity key={action.label} style={styles.quickItem} onPress={action.onPress} activeOpacity={0.85}>
                  <View style={[styles.quickIcon, { borderColor: action.color }]}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title={t('generateInvitationLink')}
              variant="outline"
              onPress={() => navigation.navigate('QRCode', { slug })}
              style={{ marginTop: spacing.md }}
            />
          </Card>

          <Text style={styles.sectionTitle}>{t('currentInvitees')} ({invitations.length})</Text>
          {loadingList ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : invitations.length === 0 ? (
            <Text style={styles.empty}>{t('noInviteesYet')}</Text>
          ) : (
            invitations.slice(0, 20).map((inv) => (
              <View key={inv.id} style={styles.invRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invName}>{inv.name}</Text>
                  <Text style={styles.invSub}>{inv.phone || '—'} · {inv.relation} · {inv.city || '—'}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{inv.status}</Text>
                </View>
              </View>
            ))
          )}
          {invitations.length > 20 ? (
            <Text style={styles.moreNote}>{t('showingFirst20')} {invitations.length} invitees</Text>
          ) : null}
        </ScrollView>
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  desc: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.md },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    minHeight: 140,
  },
  dropTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  dropSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md },
  summaryGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  summaryBox: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1 },
  summaryValid: { backgroundColor: colors.successBg, borderColor: colors.success },
  summaryInvalid: { backgroundColor: colors.errorBg, borderColor: colors.error },
  summaryNum: { fontSize: fontSize.xl, fontWeight: '800', color: colors.success },
  summaryLbl: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  totalNote: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.md },
  errorReport: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  errorReportTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.error, marginBottom: spacing.sm },
  errorLine: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  quickItem: { width: '22%', alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  quickLabel: { fontSize: 9, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xl },
  invRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  invName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  invSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statusBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  statusText: { fontSize: 9, color: colors.primary, fontWeight: '600', textTransform: 'capitalize' },
  moreNote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xxl },
});

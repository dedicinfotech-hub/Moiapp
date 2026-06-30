import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { useEventSlug } from '../../hooks/useEventSlug';
import { useEvent } from '../../hooks/useEvent';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, spacing, radius } from '../../theme';

export function EventMoreScreen() {
  const slug = useEventSlug();
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const { event } = useEvent(slug);
  const { t } = useAppSettings();

  const items: { icon: keyof typeof Ionicons.glyphMap; labelKey: string; descKey?: string; screen: 'MoiEntry' | 'HostPaymentMethod' | 'QRCode' | 'EventReports' | 'InvitationUpload' | 'InviteesUpload' | 'EventSettings' }[] = [
    { icon: 'add-circle-outline', labelKey: 'eventMenuAddMoi', screen: 'HostPaymentMethod', descKey: 'eventMenuAddMoiDesc' },
    { icon: 'qr-code-outline', labelKey: 'eventMenuQr', screen: 'QRCode', descKey: 'eventMenuQrDesc' },
    { icon: 'bar-chart-outline', labelKey: 'eventMenuReports', screen: 'EventReports', descKey: 'eventMenuReportsDesc' },
    { icon: 'people-outline', labelKey: 'eventMenuInvitees', screen: 'InviteesUpload', descKey: 'eventMenuInviteesDesc' },
    { icon: 'image-outline', labelKey: 'eventMenuInvitation', screen: 'InvitationUpload', descKey: 'eventMenuInvitationDesc' },
    { icon: 'settings-outline', labelKey: 'eventMenuSettings', screen: 'EventSettings', descKey: 'eventMenuSettingsDesc' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('eventMenu')} subtitle={event ? undefined : slug} />
      <SafeScreen scroll={true} padded={true}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.labelKey}
            style={styles.row}
            onPress={() => navigation.navigate(item.screen, { slug })}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t(item.labelKey)}</Text>
              {item.descKey ? <Text style={styles.desc}>{t(item.descKey)}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  desc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});

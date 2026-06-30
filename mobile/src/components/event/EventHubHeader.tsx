import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Event } from '../../api/types';
import { ApprovalBanner } from '../layout/ApprovalBanner';
import { getEventDisplayName, formatDate } from '../../utils/format';
import { canAddMoi } from '../../utils/eventHelpers';
import type { EventStackParamList, EventTabParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';
import { Text, StyleSheet } from 'react-native';

interface Props {
  event: Event;
  slug: string;
  subtitle?: string;
}

export function EventHubHeader({ event, slug, subtitle }: Props) {
  const navigation = useNavigation<CompositeNavigationProp<
    BottomTabNavigationProp<EventTabParamList>,
    NativeStackNavigationProp<EventStackParamList>
  >>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => navigation.getParent()?.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{getEventDisplayName(event)}</Text>
          <Text style={styles.sub}>{subtitle || `${formatDate(event.wedding_date).split(',')[0]} · ${event.city || event.venue || '—'}`}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('QRCode', { slug })} style={styles.iconBtn}>
          <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('EventReports', { slug })} style={styles.iconBtn}>
          <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('EventSettings', { slug })} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ApprovalBanner event={event} />
      {canAddMoi(event) ? (
        <View style={styles.entryRow}>
          {[
            { label: 'Manual Entry', icon: 'create-outline' as const, screen: 'HostPaymentMethod' as const, color: colors.primary },
            { label: 'Voice Entry', icon: 'mic-outline' as const, screen: 'VoiceEntry' as const, color: colors.blue },
            { label: 'Gift Entry', icon: 'gift-outline' as const, screen: 'GiftEntry' as const, color: colors.warning },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.entryBtn, { backgroundColor: `${a.color}18` }]}
              onPress={() => navigation.navigate(a.screen, { slug })}
            >
              <Ionicons name={a.icon} size={22} color={a.color} />
              <Text style={[styles.entryLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  back: { padding: 4 },
  title: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  entryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  entryBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg },
  entryLabel: { fontSize: 9, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  iconBtn: { padding: 4 },
});

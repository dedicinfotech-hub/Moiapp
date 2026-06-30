import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { RadioCard } from '../../components/forms/RadioCard';
import { Button } from '../../components/ui/Button';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function ChooseEventTypeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const [selected, setSelected] = useState<'new' | 'past' | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title={t('chooseEventType')} onBack={() => navigation.getParent()?.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>{t('chooseEventHeading')}</Text>
        <Text style={styles.sub}>{t('chooseEventSub')}</Text>

        <RadioCard
          selected={selected === 'new'}
          onPress={() => setSelected('new')}
          title={t('newEvent')}
          subtitle={t('newEventCardSub')}
          features={[t('featLiveMoi'), t('featQrGuests'), t('featAdminApproval')]}
          icon="calendar"
          accent="primary"
        />
        <RadioCard
          selected={selected === 'past'}
          onPress={() => setSelected('past')}
          title={t('pastEvent')}
          subtitle={t('pastEventCardSub')}
          features={[t('featRecordOnly'), t('featNoQr'), t('featInstantAccess')]}
          icon="time"
          accent="secondary"
        />

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.purple} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t('chooseCarefully')}</Text>
            <Text style={styles.infoText}>{t('chooseCarefullyText')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={t('continue')}
          onPress={() => selected && navigation.navigate('CreateFunction', { mode: selected })}
          disabled={!selected}
        />
        <Button title={t('cancel')} variant="ghost" onPress={() => navigation.getParent()?.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  heading: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  sub: { textAlign: 'center', color: colors.textSecondary, marginBottom: spacing.xl, fontSize: fontSize.sm, lineHeight: 20 },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.purpleLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.purple, marginBottom: 4 },
  infoText: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});

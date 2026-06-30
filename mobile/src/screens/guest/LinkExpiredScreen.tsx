import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Button } from '../../components/ui/Button';
import { eventsApi } from '../../api';
import type { Event } from '../../api/types';
import { getEventDisplayName } from '../../utils/format';
import { resetToMain } from '../../navigation/navigationRef';
import { useAuthStore } from '../../store/authStore';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useGuestToken } from '../../hooks/useGuestToken';
import type { GuestStackParamList } from '../../navigation/types';
import { colors, fontSize, spacing } from '../../theme';

export function LinkExpiredScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList>>();
  const token = useGuestToken();
  const user = useAuthStore((s) => s.user);
  const { t } = useAppSettings();
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token)
      .then((e: Event) => setEventTitle(getEventDisplayName(e)))
      .catch(() => {});
  }, [token]);

  const goHome = () => {
    if (user) {
      resetToMain();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (Platform.OS === 'web' && typeof globalThis.history !== 'undefined') {
      globalThis.history.replaceState({}, '', '/login');
    }
    navigation.getParent()?.navigate('Auth' as never);
  };

  const requestNewLink = async () => {
    const message = eventTitle
      ? `${t('requestLinkMessage')} (${eventTitle})`
      : t('requestLinkMessage');
    try {
      await Share.share({ message, title: t('requestNewLink') });
    } catch { /* cancelled */ }
  };

  return (
    <SafeScreen>
      <View style={styles.center}>
        <Ionicons name="link-outline" size={64} color={colors.textMuted} />
        <Text style={styles.title}>{t('linkExpired')}</Text>
        <Text style={styles.sub}>{t('linkExpiredSub')}</Text>
        <Button
          title={t('requestNewLink')}
          onPress={requestNewLink}
          style={{ marginTop: spacing.xl, alignSelf: 'stretch', maxWidth: 320 }}
        />
        <Button
          title={user ? t('goToDashboard') : t('backToHome')}
          variant="outline"
          onPress={goHome}
          style={{ marginTop: spacing.md, alignSelf: 'stretch', maxWidth: 320 }}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PublicStackParamList } from '../../navigation/types';
import { navigateToPublicHome, navigateToAuth, navigateToModule } from '../../navigation/navigationRef';
import { useAuthStore } from '../../store/authStore';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';
import { LogoImage } from '../ui/LogoImage';

interface PublicGuestHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  /** Home landing uses Browse + Login; other pages use Home + Login. */
  variant?: 'home' | 'default';
}

export function PublicGuestHeader({ showBack, onBack, variant = 'default' }: PublicGuestHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const user = useAuthStore((s) => s.user);
  const { scaledFontSize: fs } = useScaledTheme();
  const isHome = variant === 'home';

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      {showBack ? (
        <TouchableOpacity onPress={onBack || (() => navigation.goBack())} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={navigateToPublicHome} style={styles.brand} activeOpacity={0.85}>
          <LogoImage width={100} height={24} />
          {isHome ? <Text style={styles.logoTag}>{t('publicLogoTag')}</Text> : null}
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        {isHome ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('PublicEventsList')}
            style={styles.eventsBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.text} />
            <Text style={[styles.eventsText, { fontSize: fs.xs }]}>{t('publicNavEvents')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={navigateToPublicHome} style={styles.ghostBtn} activeOpacity={0.85}>
            <Ionicons name="home-outline" size={14} color={colors.text} />
            <Text style={[styles.ghostText, { fontSize: fs.xs }]}>{t('publicNavHome')}</Text>
          </TouchableOpacity>
        )}
        {user ? (
          <TouchableOpacity
            onPress={() => navigateToModule('dashboard')}
            style={isHome ? styles.loginPrimary : styles.ghostBtn}
            activeOpacity={0.85}
          >
            <Text style={[isHome ? styles.loginPrimaryText : styles.ghostText, { fontSize: fs.xs }]}>
              {t('dashboard')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigateToAuth('Login')}
            style={isHome ? styles.loginPrimary : styles.ghostBtn}
            activeOpacity={0.85}
          >
            <Text style={[isHome ? styles.loginPrimaryText : styles.ghostText, { fontSize: fs.xs }]}>
              {t('login')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { flexDirection: 'column', alignItems: 'flex-start', gap: 2, flex: 1 },
  logoTag: { fontSize: 9, fontWeight: '600', color: colors.textMuted },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eventsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventsText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  loginPrimary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loginPrimaryText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.text },
});

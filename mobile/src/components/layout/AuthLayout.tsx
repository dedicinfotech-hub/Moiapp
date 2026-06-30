import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigateToPublicHome } from '../../navigation/navigationRef';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing, shadow } from '../../theme';
import { LogoImage } from '../ui/LogoImage';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Show public home nav bar (logo + Home). Default true. */
  showHomeNav?: boolean;
}

export function AuthLayout({ title, subtitle, children, footer, showHomeNav = true }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();

  return (
    <LinearGradient colors={['#FFFCF5', '#FFFFFF', '#FFFCF5']} style={styles.gradient}>
      {showHomeNav ? (
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={navigateToPublicHome} style={styles.brand} activeOpacity={0.85}>
            <LogoImage width={96} height={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToPublicHome} style={styles.homeBtn} activeOpacity={0.85}>
            <Text style={[styles.homeBtnText, { fontSize: fs.xs }]}>{t('home')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <LogoImage width={140} height={34} />
            </View>
            <Text style={[styles.title, { fontSize: fs.xxl }]}>{title}</Text>
            <Text style={[styles.subtitle, { fontSize: fs.sm }]}>{subtitle}</Text>
            {children}
          </View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  homeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeBtnText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.45)',
    padding: spacing.xxl,
    ...shadow.card,
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: spacing.xl },
});

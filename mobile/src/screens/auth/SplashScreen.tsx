import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LogoImage } from '../../components/ui/LogoImage';
import type { AuthStackParamList } from '../../navigation/types';
import { navigateToPublicEvents } from '../../navigation/navigationRef';
import { colors, fontSize, radius, spacing, shadow } from '../../theme';

const FEATURES = [
  { title: 'Record Moi\nWith Love', icon: 'people-outline' as const },
  { title: 'Secure &\nPrivate', icon: 'shield-checkmark-outline' as const },
  { title: 'Track & Manage\nWith Ease', icon: 'bar-chart-outline' as const },
];

export function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 72 }]}>
        <View style={styles.logoCard}>
          <LogoImage width={200} height={48} />
        </View>

        <Text style={styles.taglineTa}>உங்கள் உறவுகளை இணைக்கும் மொய்</Text>
        <Text style={styles.taglineEn}>Connecting Relationships Through Moi</Text>

        <View style={styles.featureBar}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={colors.gold} />
              </View>
              <Text style={styles.featureText}>{f.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.replace('Register')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.loginHint}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => navigation.replace('Login')}>
            Login
          </Text>
        </Text>
        <Text style={styles.browseHint}>
          Just visiting?{' '}
          <Text style={styles.loginLink} onPress={() => navigateToPublicEvents()}>
            Browse events
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  taglineTa: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  taglineEn: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  featureBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    width: '100%',
    maxWidth: 340,
    ...shadow.card,
  },
  featureItem: { flex: 1, alignItems: 'center', gap: spacing.sm },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cta: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    ...shadow.card,
  },
  ctaText: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  loginHint: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.text,
  },
  browseHint: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.sm,
  },
  loginLink: { color: colors.gold, fontWeight: '700' },
});

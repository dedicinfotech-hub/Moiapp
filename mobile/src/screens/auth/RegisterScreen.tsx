import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { AuthStackParamList } from '../../navigation/types';
import { APP_NAME } from '../../constants/brand';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useAuthStore((s) => s.login);
  const { t } = useAppSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      await login(res.token, res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('createAccount')}
      subtitle={t('registerSubtitle')}
      footer={
        <>
          <Text style={styles.footer}>
            {t('haveAccount')}{' '}
            <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
              {t('signIn')}
            </Text>
          </Text>
          <Text style={styles.powered}>Powered by <Text style={styles.poweredBrand}>{APP_NAME}</Text></Text>
        </>
      }
    >
      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Ravi Kumar" placeholderTextColor={colors.textMuted} value={form.name} onChangeText={(v) => update('name', v)} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => update('email', v)} />

      <Text style={styles.label}>Phone <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} placeholder="Min. 6 characters" placeholderTextColor={colors.textMuted} secureTextEntry value={form.password} onChangeText={(v) => update('password', v)} />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry value={form.confirm} onChangeText={(v) => update('confirm', v)} />

      <Button title={t('createAccount')} onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.sm }} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  optional: { fontWeight: '400', color: colors.textMuted },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  errorBox: { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: fontSize.sm },
  footer: { textAlign: 'center', fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.lg },
  footerLink: { color: colors.gold, fontWeight: '700' },
  powered: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.md },
  poweredBrand: { color: colors.primary, fontWeight: '600' },
});

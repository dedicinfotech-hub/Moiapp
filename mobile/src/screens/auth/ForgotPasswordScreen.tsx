import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="We'll email you a link to reset your password"
      footer={
        <Text style={styles.footer}>
          Remember your password?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
            Back to Login
          </Text>
        </Text>
      }
    >
      {sent ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            If an account exists for this email, a reset link has been sent. Check your inbox.
          </Text>
        </View>
      ) : (
        <>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Send Reset Link" onPress={handleSubmit} loading={loading} />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
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
  errorBox: { backgroundColor: colors.errorBg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: fontSize.sm },
  successBox: { backgroundColor: colors.successBg, borderRadius: radius.md, padding: spacing.lg },
  successText: { color: colors.success, fontSize: fontSize.sm, lineHeight: 20 },
  footer: { textAlign: 'center', fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.lg },
  footerLink: { color: colors.gold, fontWeight: '700' },
});

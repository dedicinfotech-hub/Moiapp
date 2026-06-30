import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

type Mode = 'phone' | 'email';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useAuthStore((s) => s.login);
  const { t } = useAppSettings();
  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [needsAdminOtp, setNeedsAdminOtp] = useState(false);
  const [adminOtpEmail, setAdminOtpEmail] = useState('');
  const [adminOtpNotice, setAdminOtpNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!/^[0-9]{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.sendOTP(phone);
      navigation.navigate('OTP', { phone, delivery: res.delivery });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendAdminOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password });
      if (res.requires_otp) {
        setAdminOtpEmail(res.otp_email || email);
        setAdminOtpNotice(res.message || 'OTP resent. Check inbox and spam folder.');
        setAdminOtp('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password, otp: needsAdminOtp ? adminOtp : undefined });
      if (res.requires_otp) {
        setNeedsAdminOtp(true);
        setAdminOtp('');
        setAdminOtpEmail(res.otp_email || email);
        setAdminOtpNotice(res.message || 'OTP sent to your admin email. Check inbox and spam folder.');
        setError('');
        return;
      }
      if (!res.token || !res.user) {
        setError('Login failed');
        return;
      }
      await login(res.token, res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('welcomeBack')}
      subtitle={t('signInSubtitle')}
      footer={
        <Text style={styles.footer}>
          {t('noAccount')}{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
            {t('register')}
          </Text>
        </Text>
      }
    >
      <View style={styles.tabs}>
        {(['phone', 'email'] as Mode[]).map((m) => (
          <TouchableOpacity key={m} onPress={() => { setMode(m); setError(''); setNeedsAdminOtp(false); setAdminOtp(''); }} style={styles.tabBtn}>
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
              {m === 'phone' ? 'Phone Login' : 'Email Login'}
            </Text>
            {mode === m ? <View style={styles.tabIndicator} /> : null}
          </TouchableOpacity>
        ))}
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      {mode === 'phone' ? (
        <>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
          />
          <Button title={t('sendOtp')} onPress={handleSendOTP} loading={loading} disabled={phone.length !== 10} />
        </>
      ) : (
        <>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {needsAdminOtp ? (
            <>
              {adminOtpNotice ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{adminOtpNotice}</Text>
                  {adminOtpEmail ? (
                    <Text style={styles.noticeSub}>Sent to {adminOtpEmail}</Text>
                  ) : null}
                </View>
              ) : null}
              <Text style={styles.label}>Admin OTP (sent to your email)</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={adminOtp}
                onChangeText={(v) => setAdminOtp(v.replace(/\D/g, '').slice(0, 6))}
              />
              <TouchableOpacity onPress={handleResendAdminOtp} disabled={loading} style={{ marginBottom: spacing.lg }}>
                <Text style={styles.forgotLink}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          ) : null}
          <Button title={needsAdminOtp ? 'Verify & Sign In' : t('signIn')} onPress={handleEmailLogin} loading={loading} />
          {!needsAdminOtp ? (
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: spacing.md }}>
              <Text style={styles.forgotLink}>{t('forgotPassword')}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.border, marginBottom: spacing.xl },
  tabBtn: { flex: 1, alignItems: 'center', paddingBottom: spacing.md },
  tabText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.text },
  tabIndicator: { position: 'absolute', bottom: -2, left: 0, right: 0, height: 3, backgroundColor: colors.primary, borderRadius: 2 },
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
  errorBox: { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: fontSize.sm },
  noticeBox: { backgroundColor: colors.blueBg, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  noticeText: { color: colors.text, fontSize: fontSize.sm },
  noticeSub: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs },
  footer: { textAlign: 'center', fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.lg },
  footerLink: { color: colors.gold, fontWeight: '700' },
  forgotLink: { textAlign: 'center', color: colors.gold, fontWeight: '600', fontSize: fontSize.sm },
});

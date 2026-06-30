import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function OTPScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'OTP'>>();
  const { phone, delivery } = route.params;
  const login = useAuthStore((s) => s.login);
  const { t } = useAppSettings();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleVerify = async () => {
    if (!/^[0-9]{4,6}$/.test(otp)) {
      setError('Enter the OTP sent to your phone');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOTP(phone, otp);
      await login(res.token, res.user, {
        resetNav: false,
        profileSetupRequired: res.needsProfile,
      });
      if (res.needsProfile) {
        navigation.replace('ProfileSetup');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    const res = await authApi.sendOTP(phone);
    navigation.setParams({ delivery: res.delivery });
    setTimer(30);
    setOtp('');
  };

  const otpSubtitle =
    delivery === 'email'
      ? 'Enter the code sent to your registered email'
      : 'Enter the code sent to your mobile number';

  return (
    <AuthLayout title={t('verifyOtp')} subtitle={otpSubtitle}>
      <View style={styles.phoneBox}>
        <View>
          <Text style={styles.phoneLabel}>OTP SENT TO</Text>
          <Text style={styles.phoneValue}>+91 {phone}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Enter OTP</Text>
      <TextInput
        style={styles.otpInput}
        placeholder="· · · · · ·"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
        autoFocus
      />

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      <Button title="Verify & Sign In" onPress={handleVerify} loading={loading} disabled={otp.length < 4} />

      <TouchableOpacity onPress={handleResend} disabled={timer > 0} style={styles.resend}>
        <Text style={[styles.resendText, timer > 0 && { opacity: 0.5 }]}>
          {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  phoneBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  phoneLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  phoneValue: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, marginTop: 2 },
  changeLink: { fontSize: fontSize.xs, color: colors.gold, fontWeight: '700' },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  otpInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  errorBox: { backgroundColor: colors.errorBg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: fontSize.sm, textAlign: 'center' },
  resend: { alignItems: 'center', marginTop: spacing.lg },
  resendText: { color: colors.gold, fontWeight: '700', fontSize: fontSize.sm },
});

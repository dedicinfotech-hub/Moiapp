import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { colors, fontSize, radius, spacing } from '../../theme';

export function ProfileSetupScreen() {
  const completeProfileSetup = useAuthStore((s) => s.completeProfileSetup);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.updateProfile({ name, city, email });
      completeProfileSetup(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Complete Profile" subtitle="Tell us a bit about yourself">
      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Enter your name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
      <Text style={styles.label}>City</Text>
      <TextInput style={styles.input} placeholder="Enter your city" placeholderTextColor={colors.textMuted} value={city} onChangeText={setCity} />
      <Text style={styles.label}>Email <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput style={styles.input} placeholder="Enter email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Button title="Save & Continue" onPress={handleSave} loading={loading} />
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
  errorBox: { backgroundColor: colors.errorBg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: fontSize.sm },
});

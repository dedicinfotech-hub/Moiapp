import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export function Input({
  label,
  icon,
  error,
  containerStyle,
  rightElement,
  required,
  ...props
}: InputProps) {
  const { scaledFontSize: fs } = useScaledTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { fontSize: fs.sm }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.inputWrap, error && styles.inputError]}>
        {icon && (
          <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, { fontSize: fs.md }]}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
        {rightElement}
      </View>
      {error ? <Text style={[styles.error, { fontSize: fs.xs }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  required: { color: colors.error },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputError: { borderColor: colors.error },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.md },
  error: { color: colors.error, marginTop: spacing.xs },
});

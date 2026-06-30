import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmStyle =
    variant === 'danger' ? styles.confirmDanger : variant === 'warning' ? styles.confirmWarning : styles.confirmPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, confirmStyle]} onPress={onConfirm} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.confirmText}>{confirmText}</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  message: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  confirmPrimary: { backgroundColor: colors.primary },
  confirmWarning: { backgroundColor: colors.warning },
  confirmDanger: { backgroundColor: colors.error },
  confirmText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
});

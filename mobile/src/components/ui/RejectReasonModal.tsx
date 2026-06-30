import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

interface Props {
  visible: boolean;
  loading?: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export function RejectReasonModal({ visible, loading, onSubmit, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();

  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { fontSize: fs.lg }]}>{t('rejectFunctionTitle')}</Text>
          <Text style={[styles.hint, { fontSize: fs.xs }]}>{t('rejectFunctionHint')}</Text>
          <TextInput
            style={[styles.input, { fontSize: fs.sm }]}
            value={reason}
            onChangeText={setReason}
            placeholder={t('rejectFunctionPlaceholder')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={[styles.cancelText, { fontSize: fs.sm }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectBtn, !reason.trim() && styles.rejectBtnDisabled]}
              onPress={() => reason.trim() && onSubmit(reason.trim())}
              disabled={!reason.trim() || loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[styles.rejectText, { fontSize: fs.sm }]}>{t('rejectFunctionConfirm')}</Text>}
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
  hint: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 100,
    marginBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  rejectBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  rejectBtnDisabled: { opacity: 0.5 },
  rejectText: { fontSize: fontSize.sm, fontWeight: '700', color: '#fff' },
});

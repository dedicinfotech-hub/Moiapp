import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { bulkImportCSV } from '../../api/bulkImport';
import { colors, fontSize, radius, spacing } from '../../theme';

interface Props {
  visible: boolean;
  eventId: number;
  eventName: string;
  onClose: () => void;
  onImported: () => void;
}

export function BulkImportModal({ visible, eventId, eventName, onClose, onImported }: Props) {
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', '*/*'], copyToCacheDirectory: true });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setFile({ uri: asset.uri, name: asset.name || 'import.csv', type: asset.mimeType || 'text/csv' });
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Select a CSV file');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await bulkImportCSV(eventId, file);
      setSuccess(`Imported ${res.imported} entries successfully.`);
      setTimeout(() => {
        onImported();
        onClose();
        setFile(null);
        setSuccess('');
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Bulk Import Moi</Text>
          <Text style={styles.sub}>Import CSV for {eventName}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
            <Text style={styles.fileBtnText}>{file ? file.name : 'Choose CSV file'}</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Columns: guest_name, amount, gift_type, relation, payment_mode, note</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={loading || !file}>
              {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.importText}>Import</Text>}
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
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.sm },
  success: { color: colors.success, fontSize: fontSize.sm, marginBottom: spacing.sm },
  fileBtn: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.sm },
  fileBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  hint: { fontSize: 10, color: colors.textMuted, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  importBtn: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  importText: { fontWeight: '700', color: colors.text },
});

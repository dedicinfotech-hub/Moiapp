import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { EventHubLayout } from '../../components/event/EventHubLayout';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useEvent } from '../../hooks/useEvent';
import { invitationsApi, moiApi } from '../../api';
import type { Invitation } from '../../api/invitations';
import type { MoiEntry } from '../../api/types';
import { Button } from '../../components/ui/Button';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const CSV_TEMPLATE = 'name,phone,relation,city\nRavi Kumar,9876543210,friend,Chennai';

export function EventInvitationsScreen() {
  const slug = useScreenSlug();
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const { event } = useEvent(slug);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    if (!event) return;
    Promise.all([
      invitationsApi.list(event.id),
      moiApi.list(event.id),
    ]).then(([inv, moi]) => {
      setInvitations(inv.invitations || []);
      setEntries(moi.entries || []);
    }).catch(() => {
      setInvitations([]);
      setEntries([]);
    });
  }, [event?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const downloadTemplate = async () => {
    const fileUri = `${FileSystem.cacheDirectory}invitation-template.csv`;
    await FileSystem.writeAsStringAsync(fileUri, CSV_TEMPLATE);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
    }
  };

  const uploadCsv = async () => {
    if (!event) return;
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const res = await invitationsApi.uploadCsv(event.id, {
        uri: asset.uri,
        name: asset.name || 'invitees.csv',
        type: asset.mimeType || 'text/csv',
      });
      Alert.alert('Uploaded', `${res.count} invitations imported`);
      load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const matched = invitations.map((inv) => {
    const moiMatch = entries.find(
      (e) =>
        e.guest_name.toLowerCase() === inv.name.toLowerCase() ||
        (inv.phone && e.phone && e.phone.replace(/\D/g, '').slice(-10) === inv.phone.replace(/\D/g, '').slice(-10))
    );
    return { ...inv, gave_moi: !!moiMatch, moi_amount: moiMatch?.amount };
  });

  const notInvitedButGave = entries.filter(
    (e) => !invitations.some((inv) => inv.name.toLowerCase() === e.guest_name.toLowerCase())
  );

  const filtered = matched.filter(
    (inv) => !search || inv.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    invited: matched.filter((i) => i.status === 'invited').length,
    came: matched.filter((i) => i.status === 'came' || i.gave_moi).length,
    gave_moi: matched.filter((i) => i.gave_moi).length,
    no_show: matched.filter((i) => i.status === 'no_show').length,
  };

  return (
    <EventHubLayout slug={slug} activeTab="invitations">
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View style={styles.actions}>
              <Button title="Upload CSV" onPress={uploadCsv} loading={uploading} style={{ flex: 1 }} fullWidth={false} />
              <Button title="Template" variant="outline" onPress={downloadTemplate} style={{ flex: 1 }} fullWidth={false} />
            </View>
            <Button title="Bulk Invitees Upload" variant="ghost" onPress={() => navigation.navigate('InviteesUpload', { slug })} />

            <Text style={styles.sectionTitle}>Attendance Summary</Text>
            <View style={styles.summaryGrid}>
              {[
                { label: 'Invited', value: invitations.length },
                { label: 'Gave Moi', value: statusCounts.gave_moi },
                { label: 'Came', value: statusCounts.came },
                { label: 'No Show', value: statusCounts.no_show },
              ].map((s) => (
                <View key={s.label} style={styles.summaryCell}>
                  <Text style={styles.summaryVal}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {notInvitedButGave.length > 0 ? (
              <View style={styles.alertBox}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={styles.alertText}>{notInvitedButGave.length} guest(s) gave moi but were not on the invitation list.</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.search}
              placeholder="Search invitations…"
              value={search}
              onChangeText={setSearch}
            />
            <Text style={styles.listTitle}>Invitations ({filtered.length})</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No invitations uploaded yet. Upload a CSV guest list.</Text>}
        renderItem={({ item }) => (
          <View style={styles.invRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invName}>{item.name}</Text>
              <Text style={styles.invSub}>{item.phone || '—'} · {item.relation} · {item.city || '—'}</Text>
              {item.gave_moi ? <Text style={styles.moiTag}>Gave Moi{item.moi_amount ? ` · ₹${item.moi_amount}` : ''}</Text> : null}
            </View>
            <View style={[styles.badge, item.gave_moi && styles.badgeSuccess]}>
              <Text style={styles.badgeText}>{item.gave_moi ? 'gave moi' : item.status.replace('_', ' ')}</Text>
            </View>
          </View>
        )}
      />
    </EventHubLayout>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginVertical: spacing.md },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCell: { width: '47%', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  summaryVal: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gold },
  summaryLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  alertBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warningBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  alertText: { flex: 1, fontSize: fontSize.xs, color: colors.text },
  search: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, fontSize: fontSize.sm },
  listTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xl },
  invRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  invName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  invSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  moiTag: { fontSize: 10, color: colors.success, fontWeight: '600', marginTop: 2 },
  badge: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  badgeSuccess: { backgroundColor: colors.successBg },
  badgeText: { fontSize: 9, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
});

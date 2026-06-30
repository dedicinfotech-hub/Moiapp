import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EventHubLayout } from '../../components/event/EventHubLayout';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useEvent } from '../../hooks/useEvent';
import { returnGiftsApi, moiApi } from '../../api';
import type { ReturnGift } from '../../api/returnGifts';
import { Input } from '../../components/ui/Input';
import { DatePickerField } from '../../components/forms/DatePickerField';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { SelectChips } from '../../components/forms/SelectChips';
import { formatCurrency } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { colors, fontSize, radius, spacing } from '../../theme';

type ReturnType = ReturnGift['return_type'];
type ReturnStatus = ReturnGift['status'];

export function ReturnTrackerScreen() {
  const slug = useScreenSlug();
  const { event } = useEvent(slug);
  const { t } = useAppSettings();
  const [items, setItems] = useState<ReturnGift[]>([]);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReturnGift | null>(null);
  const [form, setForm] = useState({
    guest_name: '',
    return_type: 'cash' as ReturnType,
    return_amount: '',
    return_gold_weight: '',
    return_gift_description: '',
    return_date: '',
    status: 'pending' as ReturnStatus,
    note: '',
  });

  const load = useCallback(() => {
    if (!event) return;
    returnGiftsApi.list(event.id).then((r) => setItems(r.return_gifts || [])).catch(() => setItems([]));
    moiApi.list(event.id).then((r) => {
      const names = [...new Set((r.entries || []).map((e) => e.guest_name))];
      setGuestNames(names);
    });
  }, [event?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pending = items.filter((i) => i.status === 'pending').length;
  const returned = items.filter((i) => i.status === 'returned').length;

  const handleSave = async () => {
    if (!event || !form.guest_name.trim()) {
      Alert.alert(t('required'), t('returnTrackerGuest'));
      return;
    }
    setLoading(true);
    try {
      await returnGiftsApi.add({
        event_id: event.id,
        guest_name: form.guest_name.trim(),
        return_type: form.return_type,
        return_amount: form.return_type === 'cash' ? parseFloat(form.return_amount) || 0 : null,
        return_gold_weight: form.return_type === 'gold' ? parseFloat(form.return_gold_weight) || 0 : null,
        return_gift_description: form.return_type === 'gift' ? form.return_gift_description : undefined,
        return_date: form.return_date || undefined,
        status: form.status,
        note: form.note || undefined,
      });
      setForm({ guest_name: '', return_type: 'cash', return_amount: '', return_gold_weight: '', return_gift_description: '', return_date: '', status: 'pending', note: '' });
      load();
      Alert.alert(t('saved'), t('returnSaved'));
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: ReturnGift) => setDeleteTarget(item);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const item = deleteTarget;
    setDeleteTarget(null);
    try {
      await returnGiftsApi.delete(item.id);
      load();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : 'Failed');
    }
  };

  const markReturned = async (item: ReturnGift) => {
    try {
      await returnGiftsApi.update(item.id, { status: 'returned' });
      load();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <EventHubLayout slug={slug} activeTab="returns">
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statVal}>{items.length}</Text><Text style={styles.statLabel}>{t('returnTrackerTotal')}</Text></View>
              <View style={styles.stat}><Text style={styles.statVal}>{pending}</Text><Text style={styles.statLabel}>{t('returnTrackerPending')}</Text></View>
              <View style={styles.stat}><Text style={styles.statVal}>{returned}</Text><Text style={styles.statLabel}>{t('returnTrackerReturned')}</Text></View>
            </View>

            <Text style={styles.formTitle}>{t('returnTrackerAdd')}</Text>
            <Input label={t('returnTrackerGuest')} value={form.guest_name} onChangeText={(v) => setForm((p) => ({ ...p, guest_name: v }))} placeholder="Select or type guest name" />
            {guestNames.length > 0 ? (
              <View style={styles.chipRow}>
                {guestNames.slice(0, 8).map((n) => (
                  <TouchableOpacity key={n} style={styles.nameChip} onPress={() => setForm((p) => ({ ...p, guest_name: n }))}>
                    <Text style={styles.nameChipText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <SelectChips
              label={t('returnTrackerType')}
              options={[
                { value: 'cash', label: t('cash') },
                { value: 'gold', label: t('gold') },
                { value: 'gift', label: t('others') },
                { value: 'none', label: 'None' },
              ]}
              value={form.return_type}
              onChange={(v) => setForm((p) => ({ ...p, return_type: v as ReturnType }))}
            />
            {form.return_type === 'cash' ? (
              <Input label="Return Amount (₹)" value={form.return_amount} onChangeText={(v) => setForm((p) => ({ ...p, return_amount: v }))} keyboardType="numeric" />
            ) : null}
            {form.return_type === 'gold' ? (
              <Input label="Gold Weight (g)" value={form.return_gold_weight} onChangeText={(v) => setForm((p) => ({ ...p, return_gold_weight: v }))} keyboardType="numeric" />
            ) : null}
            {form.return_type === 'gift' ? (
              <Input label="Gift Description" value={form.return_gift_description} onChangeText={(v) => setForm((p) => ({ ...p, return_gift_description: v }))} />
            ) : null}
            <DatePickerField
              label="Return Date"
              value={form.return_date}
              onChange={(v) => setForm((p) => ({ ...p, return_date: v }))}
              placeholder="Optional"
            />
            <Input label="Note" value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} multiline />
            <Button title={t('save')} onPress={handleSave} loading={loading} style={{ marginBottom: spacing.lg }} />

            <Text style={styles.listTitle}>Return Gifts ({items.length})</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No return gifts tracked yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.guest_name}</Text>
              <Text style={styles.sub}>
                {item.return_type}
                {item.return_amount ? ` · ${formatCurrency(item.return_amount)}` : ''}
                {item.return_gold_weight ? ` · ${item.return_gold_weight}g` : ''}
              </Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            {item.status === 'pending' ? (
              <TouchableOpacity onPress={() => markReturned(item)} style={styles.markBtn}>
                <Text style={styles.markText}>Mark Returned</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
      <ConfirmModal
        visible={!!deleteTarget}
        title={t('delete')}
        message={deleteTarget ? `${t('returnDeleteTitle')} ${deleteTarget.guest_name}?` : ''}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </EventHubLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stat: { flex: 1, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted },
  formTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  nameChip: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  nameChipText: { fontSize: 10, color: colors.text },
  listTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  status: { fontSize: 10, color: colors.primary, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  markBtn: { backgroundColor: colors.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  markText: { fontSize: 9, color: colors.success, fontWeight: '700' },
});

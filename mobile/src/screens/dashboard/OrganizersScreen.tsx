import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SelectField } from '../../components/forms/SelectField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { eventsApi, organizersApi } from '../../api';
import type { Event } from '../../api/types';
import type { Organizer } from '../../api/organizers';
import { getEventDisplayName } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { MoreStackParamList } from '../../navigation/types';
import { usePagination } from '../../hooks/usePagination';
import { PaginatedListFooter } from '../../components/ui/PaginatedListFooter';
import { colors, fontSize, radius, spacing } from '../../theme';

export function OrganizersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('organizer');
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Organizer | null>(null);
  const [removing, setRemoving] = useState(false);

  useFocusEffect(useCallback(() => {
    eventsApi.list().then((list) => {
      setEvents(list);
      if (list.length === 1) setSelectedId(list[0].id);
    }).catch(() => setEvents([]));
  }, []));

  const eventOptions = useMemo(
    () => events.map((ev) => ({ value: ev.id, label: getEventDisplayName(ev) })),
    [events]
  );

  const loadOrganizers = useCallback(() => {
    if (!selectedId) {
      setOrganizers([]);
      return;
    }
    setListLoading(true);
    organizersApi
      .list(selectedId)
      .then((r) => setOrganizers(r.organizers || []))
      .catch(() => setOrganizers([]))
      .finally(() => setListLoading(false));
  }, [selectedId]);

  useFocusEffect(useCallback(() => { loadOrganizers(); }, [loadOrganizers]));

  const openAddModal = () => {
    if (!selectedId) {
      setAddError(t('orgSelectEventFirst'));
      return;
    }
    setAddError('');
    setEmail('');
    setRole('organizer');
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!selectedId) {
      setAddError(t('orgSelectEventFirst'));
      return;
    }
    if (!email.trim()) {
      setAddError(t('orgEmailRequired'));
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await organizersApi.add({ event_id: selectedId, email: email.trim(), role });
      setShowAddModal(false);
      setEmail('');
      loadOrganizers();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : t('error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await organizersApi.remove(removeTarget.id);
      setRemoveTarget(null);
      loadOrganizers();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : t('error'));
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  const { visible: visibleOrganizers, hasMore, loadMore, total } = usePagination(organizers, 20);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('modOrganizers')}
        subtitle={t('modOrganizersSub')}
        onBack={() => navigation.goBack()}
        rightElement={(
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.headerAdd}
            hitSlop={8}
            accessibilityLabel={t('orgAddOrganizer')}
          >
            <Ionicons name="add-circle-outline" size={24} color={selectedId ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        )}
      />

      <View style={styles.topBar}>
        <SelectField
          label={t('orgSelectEvent')}
          placeholder={t('orgSelectEventPlaceholder')}
          value={selectedId}
          options={eventOptions}
          onChange={setSelectedId}
          disabled={events.length === 0}
        />
        <Button
          title={t('orgAddOrganizer')}
          onPress={openAddModal}
          disabled={!selectedId}
          fullWidth
        />
      </View>

      <FlatList
        data={visibleOrganizers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
        ListHeaderComponent={(
          <Text style={styles.sectionTitle}>
            {t('orgCoOrganizers')}
            {selectedId ? ` (${total})` : ''}
          </Text>
        )}
        ListEmptyComponent={
          selectedId && !listLoading ? (
            <Text style={styles.empty}>{t('orgNoOrganizers')}</Text>
          ) : null
        }
        onEndReached={() => { if (hasMore) loadMore(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          listLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : selectedId ? (
            <PaginatedListFooter
              hasMore={hasMore}
              shown={visibleOrganizers.length}
              total={total}
              onLoadMore={loadMore}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.name || item.email}</Text>
              <Text style={styles.meta}>{item.email} • {item.role}</Text>
            </View>
            <TouchableOpacity onPress={() => setRemoveTarget(item)} hitSlop={8}>
              <Text style={styles.remove}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('orgAddOrganizer')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input
              label={t('orgRegisteredEmail')}
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
            />
            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleRow}>
              {['organizer', 'admin'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {addError ? <Text style={styles.errorText}>{addError}</Text> : null}
            <Button title={t('orgAddOrganizer')} onPress={handleAdd} loading={saving} />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!removeTarget}
        title={t('orgRemoveTitle')}
        message={t('orgRemoveMessage')}
        confirmText={t('delete')}
        variant="danger"
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerAdd: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  remove: { color: colors.error, fontWeight: '600', fontSize: fontSize.sm },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xl },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  roleLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  roleChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  roleText: { fontSize: fontSize.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  roleTextActive: { color: colors.gold, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
});

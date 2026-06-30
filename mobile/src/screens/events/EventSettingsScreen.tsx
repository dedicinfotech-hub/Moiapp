import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Input } from '../../components/ui/Input';
import { DatePickerField } from '../../components/forms/DatePickerField';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { SelectChips, EVENT_TYPE_OPTIONS } from '../../components/forms/SelectChips';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useEvent } from '../../hooks/useEvent';
import { useAppSettings } from '../../context/AppSettingsContext';
import { eventsApi } from '../../api';
import type { Event } from '../../api/types';
import type { EventStackParamList } from '../../navigation/types';
import { getEventDisplayName } from '../../utils/format';
import { colors, fontSize, spacing } from '../../theme';

export function EventSettingsScreen() {
  const slug = useScreenSlug();
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const { event, reload } = useEvent(slug);
  const { t } = useAppSettings();
  const [form, setForm] = useState<Partial<Event>>({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (event) {
      setForm({
        event_type: event.event_type,
        custom_title: event.custom_title || '',
        bride_name: event.bride_name || '',
        groom_name: event.groom_name || '',
        birthday_person_name: event.birthday_person_name || '',
        birthday_person_age: event.birthday_person_age,
        mother_name: event.mother_name || '',
        father_name: event.father_name || '',
        host_name: event.host_name || '',
        spouse_name: event.spouse_name || '',
        graduate_name: event.graduate_name || '',
        wedding_date: event.wedding_date || '',
        venue: event.venue || '',
        city: event.city || '',
        description: event.description || '',
      });
    }
  }, [event?.id]);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);

  if (!event) return null;

  const update = (k: keyof Event, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await eventsApi.update(event.id, form);
      await reload();
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setShowDelete(false);
    setDeleting(true);
    try {
      await eventsApi.delete(event.id);
      navigation.getParent()?.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleResubmit = async () => {
    try {
      await eventsApi.resubmit(event.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('eventSettingsTitle')} onBack={() => navigation.goBack()} />
      <SafeScreen>
        <Text style={styles.sub}>{t('eventSettingsSub')} {getEventDisplayName(event)}</Text>

        {event.approval_status === 'rejected' ? (
          <>
            <Text style={styles.rejectReason}>{t('eventRejected')}: {event.approval_reason || '—'}</Text>
            <Button title={t('eventResubmit')} onPress={handleResubmit} style={{ marginBottom: spacing.lg }} />
          </>
        ) : null}

        <SelectChips
          label={t('cfEventType')}
          options={EVENT_TYPE_OPTIONS}
          value={form.event_type || 'wedding'}
          onChange={(v) => update('event_type', v)}
        />

        {(form.event_type === 'wedding' || form.event_type === 'engagement') && (
          <>
            <Input label={t('lblBrideName')} icon="person-outline" value={form.bride_name || ''} onChangeText={(v) => update('bride_name', v)} />
            <Input label={t('lblGroomName')} icon="person-outline" value={form.groom_name || ''} onChangeText={(v) => update('groom_name', v)} />
          </>
        )}
        {form.event_type === 'birthday' && (
          <Input label={t('lblPersonName')} icon="person-outline" value={form.birthday_person_name || ''} onChangeText={(v) => update('birthday_person_name', v)} />
        )}
        {form.event_type === 'valakaappu' && (
          <>
            <Input label={t('lblMotherName')} icon="person-outline" value={form.mother_name || ''} onChangeText={(v) => update('mother_name', v)} />
            <Input label={t('lblFatherName')} icon="person-outline" value={form.father_name || ''} onChangeText={(v) => update('father_name', v)} />
          </>
        )}
        {form.event_type === 'housewarming' && (
          <>
            <Input label={t('lblHostName')} icon="person-outline" value={form.host_name || ''} onChangeText={(v) => update('host_name', v)} />
            <Input label={t('lblSpouseName')} icon="person-outline" value={form.spouse_name || ''} onChangeText={(v) => update('spouse_name', v)} />
          </>
        )}
        {form.event_type === 'graduation' && (
          <Input label={t('lblGraduateName')} icon="person-outline" value={form.graduate_name || ''} onChangeText={(v) => update('graduate_name', v)} />
        )}
        {form.event_type === 'custom' && (
          <Input label={t('lblEventTitle')} icon="text-outline" value={form.custom_title || ''} onChangeText={(v) => update('custom_title', v)} />
        )}

        <DatePickerField
          label={t('lblDate')}
          value={form.wedding_date || ''}
          onChange={(v) => update('wedding_date', v)}
          minimumDate={event.event_mode === 'new' ? todayDate : undefined}
          maximumDate={event.event_mode === 'past' ? todayDate : undefined}
        />
        <Input label={t('lblVenue')} icon="location-outline" value={form.venue || ''} onChangeText={(v) => update('venue', v)} />
        <Input label={t('lblCity')} icon="business-outline" value={form.city || ''} onChangeText={(v) => update('city', v)} />
        <Input label={t('lblDescription')} icon="document-text-outline" value={form.description || ''} onChangeText={(v) => update('description', v)} multiline />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title={t('saveChanges')} onPress={handleSave} loading={loading} />
        <Button title={t('deleteEventTitle')} variant="outline" onPress={() => setShowDelete(true)} loading={deleting} style={{ marginTop: spacing.md, borderColor: colors.error }} />
      </SafeScreen>

      <ConfirmModal
        visible={showDelete}
        title={t('deleteEventTitle')}
        message={`${t('deleteEventMsg')}`}
        confirmText={t('deleteEventConfirm')}
        cancelText={t('cancel')}
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  rejectReason: { fontSize: fontSize.sm, color: colors.error, marginBottom: spacing.md, fontWeight: '600' },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
});

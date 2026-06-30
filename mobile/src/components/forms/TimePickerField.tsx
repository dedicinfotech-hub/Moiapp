import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../../theme';

function parseTime(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

export function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDisplayTime(value: string): string {
  const parsed = parseTime(value);
  if (!parsed) return '';
  return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

interface TimePickerFieldProps {
  label?: string;
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select time',
  icon = 'time-outline',
}: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const pickerDate = useMemo(() => parseTime(value) || new Date(), [value]);
  const [draft, setDraft] = useState(pickerDate);

  const openPicker = () => {
    setDraft(parseTime(value) || new Date());
    setOpen(true);
  };

  const applyTime = (date: Date) => {
    onChange(toTimeString(date));
    setOpen(false);
  };

  const onNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (!date) return;
    if (Platform.OS === 'android') {
      applyTime(date);
    } else {
      setDraft(date);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.inputWrap}>
          {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <input
            type="time"
            value={value || ''}
            onChange={(e: any) => onChange(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: colors.text,
              backgroundColor: 'transparent',
              fontFamily: 'inherit',
              padding: '12px 0',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.inputWrap} onPress={openPicker} activeOpacity={0.85}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <Text style={[styles.valueText, !value && styles.placeholder]}>
          {value ? formatDisplayTime(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker value={draft} mode="time" display="default" onChange={onNativeChange} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.iosCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.iosTitle}>{label || 'Select time'}</Text>
              <TouchableOpacity onPress={() => applyTime(draft)}>
                <Text style={styles.iosDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              onChange={(_, date) => { if (date) setDraft(date); }}
              style={{ backgroundColor: colors.surface }}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
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
  icon: { marginRight: spacing.sm },
  valueText: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: spacing.md },
  placeholder: { color: colors.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  iosSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  iosToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosCancel: { fontSize: fontSize.sm, color: colors.textSecondary },
  iosTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  iosDone: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
});

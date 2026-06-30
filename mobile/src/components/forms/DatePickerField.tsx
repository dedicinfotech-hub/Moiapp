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

function parseISODate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string): string {
  const parsed = parseISODate(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  required,
  icon = 'calendar-outline',
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const pickerDate = useMemo(
    () => parseISODate(value) || maximumDate || minimumDate || new Date(),
    [value, maximumDate, minimumDate]
  );
  const [draft, setDraft] = useState(pickerDate);

  const openPicker = () => {
    setDraft(parseISODate(value) || maximumDate || minimumDate || new Date());
    setOpen(true);
  };

  const applyDate = (date: Date) => {
    onChange(toISODateString(date));
    setOpen(false);
  };

  const onNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (!date) return;
    if (Platform.OS === 'android') {
      applyDate(date);
    } else {
      setDraft(date);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label ? (
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        ) : null}
        <View style={styles.inputWrap}>
          {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <input
            type="date"
            value={value || ''}
            min={minimumDate ? toISODateString(minimumDate) : undefined}
            max={maximumDate ? toISODateString(maximumDate) : undefined}
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
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.inputWrap} onPress={openPicker} activeOpacity={0.85}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <Text style={[styles.valueText, !value && styles.placeholder]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onNativeChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.iosCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.iosTitle}>{label || 'Select date'}</Text>
              <TouchableOpacity onPress={() => applyDate(draft)}>
                <Text style={styles.iosDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
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

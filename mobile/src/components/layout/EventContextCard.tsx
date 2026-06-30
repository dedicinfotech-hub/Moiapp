import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../../api/types';
import { getEventDisplayName, formatDate } from '../../utils/format';
import { colors, radius, fontSize, spacing, shadow } from '../../theme';

interface EventContextCardProps {
  event: Event;
  onViewDetails?: () => void;
}

export function EventContextCard({ event, onViewDetails }: EventContextCardProps) {
  const isActive = event.is_active === 1 && event.approval_status === 'approved';

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="gift-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{getEventDisplayName(event)}</Text>
          {onViewDetails && (
            <TouchableOpacity onPress={onViewDetails}>
              <Text style={styles.link}>View Details ›</Text>
            </TouchableOpacity>
          )}
        </View>
        {isActive && (
          <View style={styles.statusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.status}>Function is Active</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.meta}>
            {formatDate(event.wedding_date)}
            {event.event_time ? ` • ${event.event_time}` : ''}
          </Text>
        </View>
        {event.venue && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {event.venue}{event.city ? `, ${event.city}` : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flex: 1 },
  link: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  status: { fontSize: fontSize.xs, color: colors.success, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },
});

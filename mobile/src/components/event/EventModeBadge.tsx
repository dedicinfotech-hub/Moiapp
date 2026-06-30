import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Event } from '../../api/types';
import { colors, radius } from '../../theme';

export function EventModeBadge({ event }: { event: Pick<Event, 'event_mode' | 'approval_status'> }) {
  const isPast = event.event_mode === 'past';
  return (
    <View style={[styles.badge, isPast ? styles.past : styles.new]}>
      <Text style={[styles.text, isPast ? styles.pastText : styles.newText]}>
        {isPast ? 'Past Event' : 'New Event'}
      </Text>
    </View>
  );
}

export function ApprovalBadge({ event }: { event: Pick<Event, 'event_mode' | 'approval_status'> }) {
  if (event.event_mode === 'past') return null;
  const status = event.approval_status || 'approved';
  if (status === 'approved') return null;
  return (
    <View style={[styles.badge, status === 'rejected' ? styles.rejected : styles.pending]}>
      <Text style={styles.pendingText}>{status === 'rejected' ? 'Rejected' : 'Pending'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, alignSelf: 'flex-start' },
  past: { backgroundColor: colors.warningBg },
  new: { backgroundColor: colors.blueBg },
  pending: { backgroundColor: colors.warningBg },
  rejected: { backgroundColor: colors.errorBg },
  text: { fontSize: 9, fontWeight: '700' },
  pastText: { color: colors.warning },
  newText: { color: colors.blue },
  pendingText: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, textTransform: 'capitalize' },
});

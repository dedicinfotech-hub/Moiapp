import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Event } from '../../api/types';
import { canAddMoi } from '../../utils/eventHelpers';
import { colors, fontSize, radius, spacing } from '../../theme';

interface ApprovalBannerProps {
  event: Event;
}

export function ApprovalBanner({ event }: ApprovalBannerProps) {
  if (canAddMoi(event)) return null;

  const isPending = event.approval_status === 'pending';
  const isRejected = event.approval_status === 'rejected';

  return (
    <View style={[styles.banner, isRejected ? styles.rejected : styles.pending]}>
      <Text style={[styles.title, isRejected && styles.rejectedTitle]}>
        {isPending ? '⏳ Pending Admin Approval' : '❌ Function Rejected'}
      </Text>
      <Text style={styles.body}>
        {isPending
          ? 'Your function is submitted. Admin will approve within 24 hours. Moi entry and QR are disabled until then.'
          : 'Please review the reason below, edit your function, and resubmit.'}
      </Text>
      {isRejected && event.approval_reason ? (
        <Text style={styles.reason}>Reason: {event.approval_reason}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pending: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  rejected: {
    backgroundColor: colors.errorBg,
    borderColor: colors.error,
  },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.warning },
  rejectedTitle: { color: colors.error },
  body: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  reason: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
});

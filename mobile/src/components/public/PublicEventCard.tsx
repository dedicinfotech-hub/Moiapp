import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../../api/types';
import { getEventDisplayName } from '../../utils/format';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

interface PublicEventCardProps {
  event: Event;
  onPress: () => void;
}

export function PublicEventCard({ event, onPress }: PublicEventCardProps) {
  const { t, settings } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const locale = settings.language === 'ta' ? 'ta-IN' : 'en-IN';
  const date = new Date(event.wedding_date);
  const isPast = event.wedding_date < new Date().toISOString().split('T')[0];
  const day = date.toLocaleDateString(locale, { day: '2-digit' });
  const mon = date.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const guestCount = Number(event.guest_count || event.stats?.guest_count || 0);

  return (
    <TouchableOpacity style={[styles.card, isPast && styles.cardPast]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cover}>
        {event.cover_photo ? (
          <Image source={{ uri: event.cover_photo }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="gift-outline" size={36} color={colors.gold} />
          </View>
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateMon}>{mon}</Text>
          <Text style={[styles.dateDay, { fontSize: fs.lg }]}>{day}</Text>
          <Text style={styles.dateYear}>{year}</Text>
        </View>
        {!isPast && daysLeft >= 0 && daysLeft <= 7 ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {daysLeft === 0 ? t('publicToday') : t('publicDaysLeft').replace('{n}', String(daysLeft))}
            </Text>
          </View>
        ) : null}
        {isPast ? (
          <View style={[styles.statusBadge, styles.pastBadge]}>
            <Text style={[styles.statusText, { color: '#fff' }]}>{t('publicCompleted')}</Text>
          </View>
        ) : null}
        <View style={styles.coverOverlay} />
        <View style={styles.coverTitle}>
          <Text style={[styles.title, { fontSize: fs.md }]} numberOfLines={2}>{getEventDisplayName(event)}</Text>
        </View>
      </View>
      <View style={styles.body}>
        {event.venue ? (
          <Text style={[styles.venue, { fontSize: fs.xs }]} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {event.venue}
            {event.city ? `, ${event.city}` : ''}
          </Text>
        ) : null}
        <View style={styles.stats}>
          <Text style={[styles.statVal, { fontSize: fs.lg }]}>{guestCount}</Text>
          <Text style={[styles.statLbl, { fontSize: fs.xs }]}>{t('guestsSuffix')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardPast: { opacity: 0.85 },
  cover: { height: 160, backgroundColor: colors.primaryLight, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverTitle: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: '800', color: '#fff' },
  dateBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 44,
    zIndex: 1,
  },
  dateMon: { fontSize: 9, fontWeight: '800', color: colors.gold },
  dateDay: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, lineHeight: 22 },
  dateYear: { fontSize: 9, color: colors.textMuted },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    zIndex: 1,
  },
  pastBadge: { backgroundColor: 'rgba(0,0,0,0.5)' },
  statusText: { fontSize: 10, fontWeight: '800', color: colors.text },
  body: { padding: spacing.md },
  venue: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  stats: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statVal: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: fontSize.xs, color: colors.textMuted },
});

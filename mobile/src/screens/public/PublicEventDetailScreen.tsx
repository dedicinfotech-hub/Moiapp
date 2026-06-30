import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Button } from '../../components/ui/Button';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { eventsApi, photosApi } from '../../api';
import type { Photo } from '../../api/photos';
import type { Event } from '../../api/types';
import { canAcceptGuestMoi } from '../../utils/eventHelpers';
import {
  formatDate,
  getEventPrimaryTitle,
  getOrganizerDisplayName,
  parseAmount,
} from '../../utils/format';
import { EVENT_TYPE_I18N_KEYS } from '../../utils/createFunctionHelpers';
import { navigateToGuestForm } from '../../navigation/guestNavigation';
import type { PublicStackParamList } from '../../navigation/types';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

const API_BASE =
  (Constants.expoConfig?.extra?.apiUrl as string)?.replace(/\/api$/, '') || 'https://dsitesai.com/moiapp';

const SCREEN_W = Dimensions.get('window').width;
const PHOTO_COL = (SCREEN_W - spacing.lg * 2 - spacing.sm * 2) / 3;

function DetailRow({
  icon,
  label,
  value,
  action,
  fs,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  action?: { label: string; onPress: () => void };
  fs: { xs: number; sm: number };
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { fontSize: fs.xs }]}>{label}</Text>
        <Text style={[styles.detailValue, { fontSize: fs.sm }]}>{value}</Text>
        {action ? (
          <TouchableOpacity onPress={action.onPress} hitSlop={8}>
            <Text style={[styles.detailAction, { fontSize: fs.xs }]}>{action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function PublicEventDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const route = useRoute<RouteProp<PublicStackParamList, 'PublicEventDetail'>>();
  const { slug } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const eventTypeLabel = (ev: Event) => t(EVENT_TYPE_I18N_KEYS[ev.event_type]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setNotFound(false);
    eventsApi
      .get(slug)
      .then((ev) => {
        setEvent(ev);
        return photosApi.list(ev.id);
      })
      .then(setPhotos)
      .catch(() => {
        setEvent(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]));

  const shareUrl = `${API_BASE}/e/${slug}`;
  const guestCount = parseAmount(event?.stats?.guest_count ?? event?.guest_count);
  const canPay = event ? canAcceptGuestMoi(event) : false;
  const primaryTitle = event ? getEventPrimaryTitle(event) : '';
  const organizerName = event ? getOrganizerDisplayName(event) : '';
  const weddingDate = event ? formatDate(event.wedding_date) : '';

  const openMaps = (venue: string) => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(venue)}`);
  };

  const handleWhatsApp = () => {
    const text = t('publicWhatsAppShare').replace('{title}', primaryTitle).replace('{url}', shareUrl);
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${t('publicShareGiveMoi').replace('{title}', primaryTitle)}\n${shareUrl}`,
        url: shareUrl,
        title: primaryTitle,
      });
    } catch {
      /* cancelled */
    }
  };

  const handleGiveMoi = () => {
    if (!event?.guest_token) {
      Alert.alert(t('publicContributionsClosedTitle'), t('publicContributionsUnavailable'));
      return;
    }
    if (!canPay) {
      Alert.alert(
        t('publicContributionsClosedTitle'),
        event.event_mode === 'past' ? t('publicPastEventClosed') : t('publicPendingApprovalClosed'),
      );
      return;
    }
    navigateToGuestForm(event.guest_token, { eventSlug: event.slug });
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { fontSize: fs.sm }]}>{t('publicLoadingEvent')}</Text>
        </View>
      </View>
    );
  }

  if (notFound || !event) {
    return (
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="sad-outline" size={48} color={colors.gold} />
          <Text style={[styles.notFoundTitle, { fontSize: fs.xl }]}>{t('publicEventNotFound')}</Text>
          <Text style={[styles.notFoundSub, { fontSize: fs.sm }]}>{t('publicEventNotFoundSub')}</Text>
          <Button
            title={t('publicBrowseAllEvents')}
            variant="outline"
            onPress={() => navigation.navigate('PublicEventsList')}
            style={{ marginTop: spacing.lg, maxWidth: 240 }}
          />
        </View>
      </View>
    );
  }

  const closedMessage =
    event.event_mode === 'past' ? t('publicPastEventClosed') : t('publicPendingApprovalClosed');
  const typeLabel = eventTypeLabel(event);

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { fontSize: fs.md }]} numberOfLines={1}>{primaryTitle}</Text>
        <TouchableOpacity onPress={handleWhatsApp} style={styles.iconBtn}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-social-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (canPay ? 100 : spacing.xl) }}>
        <View style={styles.bannerWrap}>
          {event.cover_photo ? (
            <Image source={{ uri: event.cover_photo }} style={styles.bannerImg} resizeMode="cover" />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="gift-outline" size={44} color={colors.gold} />
              <Text style={[styles.bannerPlaceholderText, { fontSize: fs.sm }]}>
                {typeLabel} {t('publicEventSuffix')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.typePill}>
            <Ionicons name="heart" size={14} color={colors.gold} />
            <Text style={[styles.typePillText, { fontSize: fs.sm }]}>{typeLabel}</Text>
          </View>
          <Text style={[styles.title, { fontSize: fs.xxl }]}>{primaryTitle}</Text>

          <View style={styles.metaBlock}>
            <View style={styles.metaLine}>
              <Ionicons name="calendar-outline" size={18} color={colors.gold} />
              <Text style={[styles.metaLineText, { fontSize: fs.sm }]}>{weddingDate}</Text>
            </View>
            {event.venue ? (
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={18} color={colors.gold} />
                <Text style={[styles.metaLineText, { flex: 1, fontSize: fs.sm }]}>{event.venue}</Text>
                <TouchableOpacity onPress={() => openMaps(event.venue!)}>
                  <Text style={[styles.mapLink, { fontSize: fs.xs }]}>{t('publicMapLink')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {event.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>{t('publicAboutEvent')}</Text>
              <Text style={[styles.desc, { fontSize: fs.md }]} numberOfLines={showMore ? undefined : 4}>
                {event.description}
              </Text>
              {event.description.length > 200 ? (
                <TouchableOpacity onPress={() => setShowMore((v) => !v)}>
                  <Text style={[styles.readMore, { fontSize: fs.sm }]}>
                    {showMore ? t('publicShowLess') : t('publicReadMore')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {guestCount > 0 ? (
            <View style={[styles.section, styles.sectionBorder]}>
              <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>{t('publicMoiSummary')}</Text>
              <Text style={[styles.statNum, { fontSize: fs.xxl }]}>{guestCount}</Text>
              <Text style={[styles.statLbl, { fontSize: fs.sm }]}>{t('publicGuestsRegistered')}</Text>
            </View>
          ) : null}

          {photos.length > 0 ? (
            <View style={[styles.section, styles.sectionBorder]}>
              <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>{t('publicPhotos')}</Text>
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.s3_url }}
                    style={styles.photoCell}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>{t('publicEventDetails')}</Text>
            <DetailRow icon="calendar-outline" label={t('lblDate')} value={weddingDate} fs={fs} />
            {event.venue ? (
              <DetailRow
                icon="location-outline"
                label={t('lblVenue')}
                value={event.venue}
                action={{ label: t('publicOpenMaps'), onPress: () => openMaps(event.venue!) }}
                fs={fs}
              />
            ) : null}
            {event.event_type === 'wedding' ? (
              <>
                <DetailRow icon="heart-outline" label={t('lblBride')} value={event.bride_name || '—'} fs={fs} />
                <DetailRow icon="people-outline" label={t('lblGroom')} value={event.groom_name || '—'} fs={fs} />
              </>
            ) : null}
            {event.event_type === 'graduation' && event.graduate_name ? (
              <DetailRow icon="school-outline" label={t('lblGraduate')} value={event.graduate_name} fs={fs} />
            ) : null}
            {event.event_type === 'housewarming' ? (
              <>
                <DetailRow icon="people-outline" label={t('lblHost')} value={event.host_name || '—'} fs={fs} />
                {event.spouse_name ? (
                  <DetailRow icon="people-outline" label={t('lblSpouse')} value={event.spouse_name} fs={fs} />
                ) : null}
              </>
            ) : null}
          </View>

          <View style={styles.organizerCard}>
            <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>{t('publicOrganizedBy')}</Text>
            <View style={styles.organizerRow}>
              <View style={styles.organizerAvatar}>
                <Text style={[styles.organizerAvatarText, { fontSize: fs.xl }]}>
                  {(organizerName.charAt(0) || '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.organizerName, { fontSize: fs.md }]}>{organizerName}</Text>
                {event.creator_name ? (
                  <Text style={[styles.organizerSub, { fontSize: fs.sm }]}>
                    {t('publicListedBy').replace('{name}', event.creator_name)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {!canPay ? (
            <InfoBanner variant="warning" message={closedMessage} />
          ) : null}
        </View>
      </ScrollView>

      {canPay ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.bottomBarText}>
            <Text style={[styles.bottomBarLabel, { fontSize: fs.xs }]}>
              {typeLabel} {t('publicGiftSuffix')}
            </Text>
            <Text style={[styles.bottomBarTitle, { fontSize: fs.lg }]}>{t('publicGiveMoi')}</Text>
            <Text style={styles.bottomBarTa}>{t('publicGiveMoiTa')}</Text>
          </View>
          <TouchableOpacity style={styles.giveMoiBtn} onPress={handleGiveMoi} activeOpacity={0.9}>
            <Text style={[styles.giveMoiBtnText, { fontSize: fs.sm }]}>{t('publicGiveMoiNow')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.sm, color: colors.textSecondary },
  notFoundTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  notFoundSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  bannerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  bannerImg: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.border },
  bannerPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bannerPlaceholderText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gold },
  content: { padding: spacing.lg },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  typePillText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, lineHeight: 32 },
  metaBlock: { marginTop: spacing.md, gap: spacing.sm },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaLineText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  mapLink: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gold, textDecorationLine: 'underline' },
  section: { paddingVertical: spacing.lg },
  sectionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  desc: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  readMore: { marginTop: spacing.sm, fontSize: fontSize.sm, fontWeight: '700', color: colors.text, textDecorationLine: 'underline' },
  statNum: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoCell: { width: PHOTO_COL, height: PHOTO_COL, borderRadius: radius.md, backgroundColor: colors.border },
  detailRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  detailLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  detailValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: 2 },
  detailAction: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gold, marginTop: 4, textDecorationLine: 'underline' },
  organizerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerAvatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.gold },
  organizerName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  organizerSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBarText: { flex: 1 },
  bottomBarLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  bottomBarTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  bottomBarTa: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  giveMoiBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  giveMoiBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
});

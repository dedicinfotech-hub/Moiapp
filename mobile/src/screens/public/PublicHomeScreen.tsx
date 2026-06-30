import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PublicGuestHeader } from '../../components/public/PublicGuestHeader';
import { PublicEventCard } from '../../components/public/PublicEventCard';
import { Button } from '../../components/ui/Button';
import { eventsApi } from '../../api';
import type { Event } from '../../api/types';
import { getEventPrimaryTitle, parseAmount } from '../../utils/format';
import type { PublicStackParamList } from '../../navigation/types';
import { navigateToAuth } from '../../navigation/navigationRef';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';
import { LogoImage } from '../../components/ui/LogoImage';

const SCREEN_W = Dimensions.get('window').width;

type StepItem = { n: string; title: string; desc: string };
type WhyItem = { icon: 'checkmark-circle' | 'shield-checkmark' | 'wallet' | 'heart'; title: string; desc: string };

function SectionLabel({ children, fontSize: fs }: { children: string; fontSize: number }) {
  return <Text style={[styles.sectionLabel, { fontSize: fs }]}>{children}</Text>;
}

function StepList({
  steps,
  accent,
  fs,
}: {
  steps: StepItem[];
  accent?: boolean;
  fs: { sm: number; xs: number };
}) {
  return (
    <View style={styles.stepList}>
      {steps.map((s) => (
        <View key={s.n} style={styles.stepRow}>
          <View style={[styles.stepNum, accent && styles.stepNumAccent]}>
            <Text style={[styles.stepNumText, { fontSize: fs.sm }, accent && styles.stepNumTextAccent]}>{s.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepTitle, { fontSize: fs.sm }]}>{s.title}</Text>
            <Text style={[styles.stepDesc, { fontSize: fs.xs }]}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function FeaturedEventCard({
  event,
  onPress,
  t,
  fs,
  lang,
}: {
  event: Event;
  onPress: () => void;
  t: (key: string) => string;
  fs: { lg: number; xs: number; xl: number; sm: number };
  lang: string;
}) {
  const title = getEventPrimaryTitle(event);
  const guestCount = parseAmount(event.guest_count || event.stats?.guest_count);
  const dateLabel = new Date(event.wedding_date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.featuredCover}>
        {event.cover_photo ? (
          <Image source={{ uri: event.cover_photo }} style={styles.featuredImg} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#FFF8E1', '#FFFCF5']} style={styles.featuredPlaceholder}>
            <Ionicons name="heart" size={40} color={colors.gold} />
            <Text style={[styles.featuredPlaceholderText, { fontSize: fs.xs }]}>{t('publicWeddingEvent')}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.featuredOverlay} />
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>{t('publicLive')}</Text>
        </View>
        <View style={styles.featuredCoverText}>
          <Text style={[styles.featuredCoverTitle, { fontSize: fs.lg }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.featuredCoverDate, { fontSize: fs.xs }]}>{dateLabel}</Text>
        </View>
      </View>
      <View style={styles.featuredBody}>
        {event.venue ? (
          <View style={styles.featuredVenueRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.featuredVenue, { fontSize: fs.xs }]} numberOfLines={1}>{event.venue}</Text>
          </View>
        ) : null}
        <View style={styles.featuredStats}>
          <Text style={[styles.featuredStatNum, { fontSize: fs.xl }]}>{guestCount}</Text>
          <View style={styles.featuredStatLblRow}>
            <Ionicons name="people-outline" size={12} color={colors.textMuted} />
            <Text style={styles.featuredStatLbl}>{t('publicGuestsRegistered')}</Text>
          </View>
        </View>
        <View style={styles.featuredCta}>
          <Text style={[styles.featuredCtaText, { fontSize: fs.sm }]}>{t('publicGiveMoiNow')}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function PublicHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const insets = useSafeAreaInsets();
  const { t, settings } = useAppSettings();
  const lang = settings.language;
  const { scaledFontSize: fs } = useScaledTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const guestSteps = useMemo<StepItem[]>(() => [
    { n: '1', title: t('publicGuestStep1Title'), desc: t('publicGuestStep1Desc') },
    { n: '2', title: t('publicGuestStep2Title'), desc: t('publicGuestStep2Desc') },
    { n: '3', title: t('publicGuestStep3Title'), desc: t('publicGuestStep3Desc') },
  ], [t]);

  const hostSteps = useMemo<StepItem[]>(() => [
    { n: '1', title: t('publicHostStep1Title'), desc: t('publicHostStep1Desc') },
    { n: '2', title: t('publicHostStep2Title'), desc: t('publicHostStep2Desc') },
    { n: '3', title: t('publicHostStep3Title'), desc: t('publicHostStep3Desc') },
  ], [t]);

  const whyItems = useMemo<WhyItem[]>(() => [
    { icon: 'checkmark-circle', title: t('publicWhyFree'), desc: t('publicWhyFreeDesc') },
    { icon: 'shield-checkmark', title: t('publicWhySecure'), desc: t('publicWhySecureDesc') },
    { icon: 'wallet', title: t('publicWhyUpi'), desc: t('publicWhyUpiDesc') },
    { icon: 'heart', title: t('publicWhyTamil'), desc: t('publicWhyTamilDesc') },
  ], [t]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    eventsApi
      .listPublic()
      .then((evs) => setEvents(Array.isArray(evs) ? evs : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []));

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter((e) => e.wedding_date >= today);
  const featured = upcoming[0] ?? events[0] ?? null;
  const recent = events.slice(0, 4);
  const totalGuests = events.reduce((s, e) => s + parseAmount(e.guest_count || e.stats?.guest_count), 0);

  const openEvent = (slug: string) => navigation.navigate('PublicEventDetail', { slug });

  return (
    <View style={styles.screen}>
      <PublicGuestHeader variant="home" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
      >
        <LinearGradient colors={['#FFFDF5', '#FFFFFF', '#FFF8E1']} style={styles.hero}>
          <View style={styles.heroGlowRight} />
          <View style={styles.heroGlowLeft} />

          <View style={styles.heroBadge}>
            <LogoImage width={88} height={22} />
          </View>

          <Text style={[styles.heroTitle, { fontSize: fs.hero }]}>{t('publicHeroTitle')}</Text>
          {lang === 'en' ? (
            <Text style={[styles.heroTa, { fontSize: fs.md }]}>{t('publicHeroTa')}</Text>
          ) : null}

          <View style={styles.heroActions}>
            <Button
              title={t('browseWeddings')}
              onPress={() => navigation.navigate('PublicEventsList')}
              icon={<Ionicons name="arrow-forward" size={16} color={colors.text} />}
            />
            <Button
              title={t('listYourWedding')}
              variant="outline"
              onPress={() => navigateToAuth('Register')}
            />
          </View>

          {!loading && events.length > 0 ? (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { fontSize: fs.xxl }]}>{events.length}</Text>
                <Text style={[styles.statLbl, { fontSize: fs.xs }]}>{t('publicStatsEvents')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { fontSize: fs.xxl }]}>{totalGuests.toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</Text>
                <Text style={[styles.statLbl, { fontSize: fs.xs }]}>{t('publicStatsGuestsGifted')}</Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <>
            {featured ? (
              <View style={styles.block}>
                <SectionLabel fontSize={10}>{t('publicFeatured')}</SectionLabel>
                <FeaturedEventCard event={featured} onPress={() => openEvent(featured.slug)} t={t} fs={fs} lang={lang} />
                {events.length > 1 ? (
                  <Text style={[styles.moreHint, { fontSize: fs.xs }]}>
                    +{events.length - 1} {events.length > 2 ? t('publicMoreWeddings') : t('publicMoreWedding')} ·{' '}
                    <Text
                      style={styles.moreLink}
                      onPress={() => navigation.navigate('PublicEventsList')}
                    >
                      {t('publicBrowseAll')}
                    </Text>
                  </Text>
                ) : null}
              </View>
            ) : null}

            {recent.length > 0 ? (
              <View style={styles.block}>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { fontSize: fs.xl }]}>{t('publicRecent')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PublicEventsList')}>
                    <Text style={[styles.seeAll, { fontSize: fs.sm }]}>{t('publicSeeAll')} →</Text>
                  </TouchableOpacity>
                </View>
                {recent.map((ev) => (
                  <PublicEventCard key={ev.id} event={ev} onPress={() => openEvent(ev.slug)} />
                ))}
              </View>
            ) : !featured ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={40} color={colors.gold} />
                <Text style={[styles.emptyTitle, { fontSize: fs.lg }]}>{t('publicNoEvents')}</Text>
                <Text style={[styles.emptySub, { fontSize: fs.sm }]}>{t('publicNoEventsSub')}</Text>
                <Button
                  title={t('listYourWedding')}
                  onPress={() => navigateToAuth('Register')}
                  style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
                />
              </View>
            ) : null}

            <View style={[styles.block, styles.howBlock]}>
              <SectionLabel fontSize={10}>{t('publicSimpleProcess')}</SectionLabel>
              <Text style={[styles.sectionTitle, { fontSize: fs.xl }]}>{t('publicHowWorks')}</Text>

              <View style={styles.howCard}>
                <View style={styles.howCardHeader}>
                  <Ionicons name="people-outline" size={16} color={colors.gold} />
                  <Text style={styles.howCardLabel}>{t('publicForGuests')}</Text>
                </View>
                <StepList steps={guestSteps} accent fs={fs} />
                <TouchableOpacity
                  style={styles.howCta}
                  onPress={() => navigation.navigate('PublicEventsList')}
                >
                  <Text style={[styles.howCtaText, { fontSize: fs.sm }]}>{t('publicBrowseEvents')}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.howCard, styles.howCardMuted]}>
                <View style={styles.howCardHeader}>
                  <Ionicons name="home-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.howCardLabel, { color: colors.textSecondary }]}>{t('publicForCouples')}</Text>
                </View>
                <StepList steps={hostSteps} fs={fs} />
                <TouchableOpacity
                  style={[styles.howCta, styles.howCtaOutline]}
                  onPress={() => navigateToAuth('Register')}
                >
                  <Text style={[styles.howCtaOutlineText, { fontSize: fs.sm }]}>{t('listYourWedding')}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.block}>
              <SectionLabel fontSize={10}>{t('publicWhyChooseUs')}</SectionLabel>
              <Text style={[styles.sectionTitle, { fontSize: fs.xl }]}>{t('publicWhyMoiApp')}</Text>
              <View style={styles.whyGrid}>
                {whyItems.map((item) => (
                  <View key={item.title} style={styles.whyCard}>
                    <View style={styles.whyIconWrap}>
                      <Ionicons name={item.icon} size={22} color={colors.gold} />
                    </View>
                    <Text style={[styles.whyTitle, { fontSize: fs.sm }]}>{item.title}</Text>
                    <Text style={styles.whyDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            <LinearGradient colors={['#FFFCF5', '#FFF8E1']} style={styles.bottomCta}>
              <Text style={[styles.bottomCtaTitle, { fontSize: fs.lg }]}>{t('publicReadyTitle')}</Text>
              <Text style={[styles.bottomCtaSub, { fontSize: fs.sm }]}>{t('publicReadySub')}</Text>
              <Button title={t('createFreeAccount')} onPress={() => navigateToAuth('Register')} />
            </LinearGradient>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const WHY_W = (SCREEN_W - spacing.lg * 2 - spacing.sm) / 2;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
    overflow: 'hidden',
  },
  heroGlowRight: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,193,7,0.12)',
  },
  heroGlowLeft: {
    position: 'absolute',
    bottom: -40,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,193,7,0.08)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
    marginBottom: spacing.md,
  },
  heroTa: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
  heroActions: { gap: spacing.md, marginBottom: spacing.lg },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  howBlock: { backgroundColor: colors.background, paddingBottom: spacing.xl, marginTop: spacing.md },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredCover: { height: 176, position: 'relative', backgroundColor: colors.primaryLight },
  featuredImg: { width: '100%', height: '100%' },
  featuredPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  featuredPlaceholderText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.gold },
  featuredOverlay: { ...StyleSheet.absoluteFillObject },
  liveBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveBadgeText: { fontSize: 9, fontWeight: '800', color: colors.text, textTransform: 'uppercase' },
  featuredCoverText: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
  featuredCoverTitle: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  featuredCoverDate: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  featuredBody: { padding: spacing.lg },
  featuredVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  featuredVenue: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
  featuredStats: { marginBottom: spacing.md },
  featuredStatNum: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  featuredStatLblRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  featuredStatLbl: { fontSize: 10, color: colors.textMuted },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
  },
  featuredCtaText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  moreHint: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.md },
  moreLink: { color: colors.gold, fontWeight: '700' },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  howCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  howCardMuted: { backgroundColor: colors.background, borderColor: colors.border },
  howCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  howCardLabel: { fontSize: 10, fontWeight: '800', color: colors.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepList: { gap: spacing.lg },
  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumAccent: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textSecondary },
  stepNumTextAccent: { color: colors.text },
  stepTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 2 },
  stepDesc: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },
  howCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
  },
  howCtaText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  howCtaOutline: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  howCtaOutlineText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  whyCard: {
    width: WHY_W,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  whyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  whyTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, textAlign: 'center' },
  whyDesc: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  bottomCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
  },
  bottomCtaTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  bottomCtaSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});

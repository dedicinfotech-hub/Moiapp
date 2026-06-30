import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { StepIndicator } from '../../components/forms/StepIndicator';
import { EventTypeGrid } from '../../components/forms/EventTypeGrid';
import { Input } from '../../components/ui/Input';
import { DatePickerField } from '../../components/forms/DatePickerField';
import { TimePickerField } from '../../components/forms/TimePickerField';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { eventsApi } from '../../api';
import type { EventStackParamList } from '../../navigation/types';
import {
  type CreateFunctionForm,
  emptyCreateForm,
  buildFunctionName,
  syncFunctionName,
  validateStep,
  buildPayload,
  getTranslatedNameLabels,
  EVENT_TYPE_I18N_KEYS,
  CITY_OPTIONS,
  todayStr,
} from '../../utils/createFunctionHelpers';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useScaledTheme } from '../../theme/useScaledTheme';
import { colors, fontSize, radius, spacing } from '../../theme';

type Step = 1 | 2 | 3 | 4;

export function CreateFunctionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const route = useRoute<RouteProp<EventStackParamList, 'CreateFunction'>>();
  const { mode } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useAppSettings();
  const { scaledFontSize: fs } = useScaledTheme();
  const steps = [t('stepFunctionType'), t('stepDetails'), t('stepSettings'), t('stepReview')];
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateFunctionForm>(emptyCreateForm);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverMeta, setCoverMeta] = useState<{ uri: string; name: string; type: string } | null>(null);

  const modeLabel = mode === 'new' ? t('newEventMode') : t('pastEventMode');
  const nameLabels = useMemo(() => getTranslatedNameLabels(t, form.event_type), [t, form.event_type]);
  const eventTypeLabel = (type: CreateFunctionForm['event_type']) => t(EVENT_TYPE_I18N_KEYS[type]);

  const update = (field: keyof CreateFunctionForm, value: string) => {
    setForm((prev) => syncFunctionName(prev, field, value));
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    setCoverUri(asset.uri);
    setCoverMeta({ uri: asset.uri, name: `cover.${ext}`, type: asset.mimeType || 'image/jpeg' });
  };

  const goNext = () => {
    if (step < 4) {
      const err = validateStep(form, mode, step as 1 | 2 | 3);
      if (err) {
        Alert.alert(t('required'), err);
        return;
      }
    }
    if (step === 1 && !form.function_name) {
      setForm((prev) => ({ ...prev, function_name: buildFunctionName(prev) }));
    }
    setStep((s) => Math.min(4, s + 1) as Step);
  };

  const submit = async (asDraft: boolean) => {
    const err = validateStep(form, mode, 2);
    if (err) {
      Alert.alert(t('required'), err);
      return;
    }
    setLoading(true);
    try {
      const res = await eventsApi.create(buildPayload(form, mode, asDraft));
      if (coverMeta) {
        try {
          await eventsApi.uploadCover(res.id, coverMeta);
        } catch {
          // non-blocking
        }
      }
      if (asDraft) {
        Alert.alert(t('saved'), t('draftSaved'));
      }
      if (mode === 'past' || res.approval_status === 'approved') {
        navigation.replace('EventTabs', { slug: res.slug });
      } else {
        navigation.replace('PendingApproval', { slug: res.slug });
      }
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeFields = () => {
    switch (form.event_type) {
      case 'wedding':
      case 'engagement':
      case 'valakaappu':
        return (
          <>
            <View style={styles.row}>
              <View style={styles.half}>
                <Input label={`${nameLabels.name1} *`} icon="person-outline" placeholder={nameLabels.ph1} value={form.bride_name} onChangeText={(v) => update('bride_name', v)} />
              </View>
              <View style={styles.half}>
                <Input label={`${nameLabels.name2} *`} icon="person-outline" placeholder={nameLabels.ph2} value={form.groom_name} onChangeText={(v) => update('groom_name', v)} />
              </View>
            </View>
            {form.event_type === 'engagement' ? (
              <View style={styles.row}>
                <View style={styles.half}>
                  <Input label={`${t('lblMotherName')} *`} icon="woman-outline" placeholder="Lakshmi" value={form.mother_name} onChangeText={(v) => update('mother_name', v)} />
                </View>
                <View style={styles.half}>
                  <Input label={`${t('lblFatherName')} *`} icon="man-outline" placeholder="Ravi" value={form.father_name} onChangeText={(v) => update('father_name', v)} />
                </View>
              </View>
            ) : null}
          </>
        );
      case 'birthday':
        return (
          <View style={styles.row}>
            <View style={styles.half}>
              <Input label={`${t('lblPersonName')} *`} icon="person-outline" placeholder="Arun" value={form.birthday_person_name} onChangeText={(v) => update('birthday_person_name', v)} />
            </View>
            <View style={styles.half}>
              <Input label={t('lblAgeOptional')} icon="calendar-outline" placeholder="25" value={form.birthday_person_age} onChangeText={(v) => update('birthday_person_age', v)} keyboardType="numeric" />
            </View>
          </View>
        );
      case 'housewarming':
        return (
          <View style={styles.row}>
            <View style={styles.half}>
              <Input label={`${t('lblHostName')} *`} icon="person-outline" placeholder="Arun" value={form.host_name} onChangeText={(v) => update('host_name', v)} />
            </View>
            <View style={styles.half}>
              <Input label={`${t('lblSpouseName')} *`} icon="person-outline" placeholder="Priya" value={form.spouse_name} onChangeText={(v) => update('spouse_name', v)} />
            </View>
          </View>
        );
      case 'graduation':
        return <Input label={`${t('lblGraduateName')} *`} icon="school-outline" placeholder="Arun" value={form.graduate_name} onChangeText={(v) => update('graduate_name', v)} />;
      case 'custom':
        return <Input label={`${t('lblEventTitle')} *`} icon="text-outline" placeholder="Anniversary, Naming Ceremony…" value={form.custom_title} onChangeText={(v) => update('custom_title', v)} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('createFunctionTitle')}
        onBack={() => (step > 1 ? setStep((s) => (s - 1) as Step) : navigation.goBack())}
      />
      <StepIndicator current={step} steps={steps} />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={styles.modeIcon}>
              <Ionicons name="calendar-outline" size={22} color={colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeLabel}>{t('cfEventType')}</Text>
              <Text style={styles.modeValue}>{modeLabel}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ChooseEventType')} hitSlop={8}>
              <Text style={styles.changeLink}>{t('cfChange')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {step === 1 && (
          <>
            <Text style={[styles.sectionTitle, { fontSize: fs.md }]}>{t('cfSelectFunctionType')}</Text>
            <Text style={[styles.sectionSub, { fontSize: fs.sm }]}>{t('cfSelectFunctionSub')}</Text>
            <EventTypeGrid
              value={form.event_type}
              onChange={(v) => setForm((prev) => ({ ...prev, event_type: v }))}
              getLabel={(v, fallback) => t(EVENT_TYPE_I18N_KEYS[v]) || fallback}
            />
            {form.event_type === 'custom' ? (
              <Input label={`${t('lblEventTitle')} *`} placeholder="e.g. Anniversary" value={form.custom_title} onChangeText={(v) => update('custom_title', v)} />
            ) : null}
            {mode === 'new' ? (
              <InfoBanner message={t('cfNewEventApprovalBanner')} variant="warning" />
            ) : null}
          </>
        )}

        {step === 2 && (
          <>
            <Input
              label={`${t('lblFunctionName')} *`}
              icon="create-outline"
              placeholder={buildFunctionName({ ...form, function_name: '' }) || 'Enter function name'}
              value={form.function_name}
              onChangeText={(v) => update('function_name', v.slice(0, 80))}
            />
            <Text style={styles.hint}>{t('cfFunctionNameHint')}</Text>

            {renderTypeFields()}

            <View style={styles.row}>
              <View style={styles.half}>
                <DatePickerField
                  label={`${t('lblDate')} * (${mode === 'past' ? t('datePastOnly') : t('dateTodayPlus')})`}
                  value={form.wedding_date}
                  onChange={(v) => update('wedding_date', v)}
                  required
                  minimumDate={mode === 'new' ? todayDate : undefined}
                  maximumDate={mode === 'past' ? todayDate : undefined}
                />
              </View>
              <View style={styles.half}>
                <TimePickerField
                  label={t('lblTime')}
                  value={form.wedding_time}
                  onChange={(v) => update('wedding_time', v)}
                />
              </View>
            </View>

            <Input label={t('lblVenue')} icon="location-outline" placeholder="Sri Murugan Mahal" value={form.venue} onChangeText={(v) => update('venue', v)} />

            <Text style={styles.fieldLabel}>{t('lblCity')}</Text>
            <View style={styles.cityRow}>
              {CITY_OPTIONS.map((c) => {
                const val = c === 'Other' ? '' : c;
                const active = form.city === val || (c === 'Other' && form.city && !CITY_OPTIONS.includes(form.city));
                const cityLabel = c === 'Other' ? t('cityOther') : c;
                return (
                  <TouchableOpacity key={c} onPress={() => update('city', val)} style={[styles.cityChip, active && styles.cityChipActive]}>
                    <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{cityLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {form.city === '' || !CITY_OPTIONS.slice(0, -1).includes(form.city) ? (
              <Input label={t('lblCityName')} placeholder="Enter city" value={form.city} onChangeText={(v) => update('city', v)} />
            ) : null}

            <Input
              label={t('lblDescription')}
              icon="document-text-outline"
              placeholder="A brief note about the function"
              value={form.description}
              onChangeText={(v) => update('description', v.slice(0, 200))}
              multiline
            />
            <Text style={styles.charCount}>{form.description.length}/200</Text>

            <Text style={styles.fieldLabel}>{t('cfCoverPhoto')}</Text>
            <TouchableOpacity style={styles.coverBox} onPress={pickCover}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImg} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                  <Text style={styles.coverText}>{t('cfTapUploadCover')}</Text>
                  <Text style={styles.coverSub}>{t('cfCoverFormats')}</Text>
                </View>
              )}
            </TouchableOpacity>

            <InfoBanner message={t('cfGuestDetailsBanner')} />
          </>
        )}

        {step === 3 && (
          <Card>
            <Text style={styles.settingsTitle}>{t('cfSettingsTitle')}</Text>
            <Text style={styles.settingsSub}>{t('cfSettingsSub')}</Text>
            {[
              { label: t('cfQrCollection'), desc: t('cfQrCollectionDesc'), on: mode === 'new' },
              { label: t('cfGuestContributions'), desc: t('cfGuestContributionsDesc'), on: mode === 'new' },
              { label: t('cfApprovalRequired'), desc: t('cfApprovalRequiredDesc'), on: mode === 'new' },
            ].map((item) => (
              <View key={item.label} style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDesc}>{item.desc}</Text>
                </View>
                <View style={[styles.toggle, item.on ? styles.toggleOn : styles.toggleOff]}>
                  <View style={[styles.toggleKnob, item.on && styles.toggleKnobOn]} />
                </View>
              </View>
            ))}
          </Card>
        )}

        {step === 4 && (
          <Card>
            <Text style={styles.reviewTitle}>{buildFunctionName(form)}</Text>
            <View style={styles.reviewDivider} />
            {[
              [t('cfReviewFunctionType'), eventTypeLabel(form.event_type)],
              [t('cfReviewTiming'), modeLabel],
              [t('cfReviewDate'), form.wedding_date || '—'],
              [t('cfReviewTime'), form.wedding_time || '—'],
              [t('cfReviewVenue'), form.venue || '—'],
              [t('cfReviewCity'), form.city || '—'],
            ].map(([label, value]) => (
              <View key={label} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{label}</Text>
                <Text style={styles.reviewValue}>{value}</Text>
              </View>
            ))}
            {form.description ? (
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('lblNote')}</Text>
                <Text style={[styles.reviewValue, { flex: 1, textAlign: 'right' }]}>{form.description}</Text>
              </View>
            ) : null}
            {mode === 'new' ? (
              <InfoBanner message={t('cfSubmitApprovalHint')} variant="warning" />
            ) : null}
          </Card>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step < 4 ? (
          <Button title={step === 3 ? t('stepReview') : t('continue')} onPress={goNext} />
        ) : (
          <>
            <Button
              title={mode === 'past' ? t('createFunctionTitle') : t('publishFunction')}
              onPress={() => submit(false)}
              loading={loading}
            />
            <Button title={t('saveDraft')} variant="outline" onPress={() => submit(true)} loading={loading} style={{ marginTop: spacing.sm }} />
          </>
        )}
        {step === 2 ? (
          <Button title={t('saveDraft')} variant="ghost" onPress={() => submit(true)} loading={loading} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modeCard: { marginBottom: spacing.lg },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  modeIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  modeLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  modeValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.purple, marginTop: 2 },
  changeLink: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sectionSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  hint: { fontSize: 10, color: colors.textMuted, marginTop: -8, marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  cityChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cityChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cityChipText: { fontSize: fontSize.xs, color: colors.textSecondary },
  cityChipTextActive: { color: colors.gold, fontWeight: '700' },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: -8, marginBottom: spacing.md },
  coverBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, minHeight: 120 },
  coverImg: { width: '100%', height: 140 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.primaryLight },
  coverText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  coverSub: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  settingsTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  settingsSub: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  settingDesc: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: colors.purple },
  toggleOff: { backgroundColor: colors.border },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface },
  toggleKnobOn: { alignSelf: 'flex-end' },
  reviewTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  reviewDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm },
  reviewLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  reviewValue: { fontSize: fontSize.xs, fontWeight: '600', color: colors.text, textAlign: 'right', maxWidth: '60%' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});

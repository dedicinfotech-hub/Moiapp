import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApprovalGuard } from '../../hooks/useApprovalGuard';
import { saveMoiWithOfflineFallback } from '../../utils/offlineMoiSave';
import { showEntrySavedNotification } from '../../services/localNotifications';
import { useAppSettings } from '../../context/AppSettingsContext';
import { ApprovalBanner } from '../../components/layout/ApprovalBanner';
import { getApprovalBlockMessage } from '../../utils/eventHelpers';
import { EMPTY_EXTRACTED, extractVoiceDetails, getRecognitionErrorMessage, type VoiceExtractMode } from '../../utils/voiceExtract';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

type RecordingState = 'idle' | 'processing' | 'listening' | 'completed';
type RecognitionLang = 'en-IN' | 'ta-IN';

const LANG_OPTIONS: { value: VoiceExtractMode; recognitionLang: RecognitionLang; label: string; hint: string }[] = [
  { value: 'en', recognitionLang: 'en-IN', label: 'English', hint: 'e.g. "Ravi Kumar gave 1001 rupees"' },
  { value: 'ta', recognitionLang: 'ta-IN', label: 'தமிழ்', hint: 'எ.கா. "ரவி குமார் ஆயிரத்து ஒரு ரூபாய் கொடுத்தார்"' },
  { value: 'tanglish', recognitionLang: 'en-IN', label: 'Tanglish', hint: 'e.g. "Ravi Kumar ayiram roopa koduthar"' },
];

export function VoiceEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { event, canAddMoi, loading } = useApprovalGuard(slug);
  const { settings, t } = useAppSettings();
  const [state, setState] = useState<RecordingState>('idle');
  const [lang, setLang] = useState<VoiceExtractMode>('en');
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState(EMPTY_EXTRACTED);
  const [manualText, setManualText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const transcriptRef = useRef('');
  const stateRef = useRef<RecordingState>('idle');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => () => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // already stopped
    }
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setState('listening');
    setError('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = normalizeWhitespace(
      event.results.map((r) => r.transcript).join(' ')
    );
    if (!text) return;
    transcriptRef.current = text;
    setTranscript(text);
    setExtracted(extractVoiceDetails(text, lang));
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'aborted') return;
    setError(getRecognitionErrorMessage(event.error));
    setState('idle');
  });

  useSpeechRecognitionEvent('end', () => {
    const wasListening = stateRef.current === 'listening';
    if (wasListening) {
      const text = transcriptRef.current;
      if (text) setExtracted(extractVoiceDetails(text, lang));
      setState('completed');
    } else if (stateRef.current === 'processing') {
      setState('idle');
    }
  });

  const startRecording = async () => {
    if (state === 'listening' || state === 'processing') return;

    setError('');
    setState('processing');
    transcriptRef.current = '';
    setTranscript('');
    setExtracted(EMPTY_EXTRACTED);

    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setError('Microphone permission denied. Allow access in settings or type details below.');
      setState('idle');
      return;
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Allow access and try again.');
          setState('idle');
          return;
        }
        if (err instanceof Error && err.name === 'NotFoundError') {
          setError('No microphone found. Connect a microphone and try again.');
          setState('idle');
          return;
        }
      }
    }

    const recognitionLang = LANG_OPTIONS.find((o) => o.value === lang)?.recognitionLang ?? 'en-IN';
    try {
      ExpoSpeechRecognitionModule.start({
        lang: recognitionLang,
        interimResults: true,
        continuous: Platform.OS === 'web' || Platform.OS === 'ios',
      });
    } catch {
      setError('Speech recognition could not start. Use Chrome/Safari or type details below.');
      setState('idle');
    }
  };

  const stopRecording = () => {
    if (stateRef.current !== 'listening') return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // ignore
      }
    }
  };

  const applyManualTranscript = () => {
    const text = normalizeWhitespace(manualText);
    if (!text) {
      Alert.alert('Required', 'Type what was spoken, e.g. "Ravi Kumar gave 1001 rupees"');
      return;
    }
    transcriptRef.current = text;
    setTranscript(text);
    setExtracted(extractVoiceDetails(text, lang));
    setState('completed');
  };

  const handleRetry = () => {
    transcriptRef.current = '';
    setState('idle');
    setTranscript('');
    setExtracted(EMPTY_EXTRACTED);
    setManualText('');
    setError('');
  };

  const handleSave = async () => {
    if (!event) return;
    if (!canAddMoi) {
      Alert.alert('Not Approved', getApprovalBlockMessage(event));
      return;
    }
    const amount = Number(extracted.amount);
    if (!extracted.guest_name.trim() || !amount) {
      Alert.alert('Required', 'Contributor name and amount are required');
      return;
    }
    setSaving(true);
    try {
      const guestName = extracted.guest_name.trim();
      const note = extracted.note || transcript;
      const result = await saveMoiWithOfflineFallback(
        {
          event_id: event.id,
          guest_name: guestName,
          phone: extracted.phone || undefined,
          amount,
          gift_type: 'cash',
          payment_mode: 'cash',
          note,
          relation: 'other',
          entered_by: 'voice_entry',
        },
        {
          event_id: event.id,
          event_name: event.custom_title || event.slug,
          guest_name: guestName,
          phone: extracted.phone || undefined,
          amount,
          gift_type: 'cash',
          payment_mode: 'cash',
          note,
          relation: 'other',
          entered_by: 'voice_entry',
        },
        () => navigation.goBack()
      );
      if (result === 'online') {
        await showEntrySavedNotification(`${guestName} — ₹${amount}`, settings);
        Alert.alert(t('save'), t('voiceSaved'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!event) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Voice Entry" onBack={() => navigation.goBack()} />
      <SafeScreen showOfflineBanner>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <ApprovalBanner event={event} />
          <EventContextCard event={event} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.micArea}>
            <TouchableOpacity
              onPress={state === 'listening' ? stopRecording : startRecording}
              disabled={state === 'processing'}
              style={[styles.micCircle, state === 'listening' && styles.micActive]}
            >
              {state === 'processing' ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Ionicons name="mic" size={48} color={state === 'listening' ? colors.surface : colors.text} />
              )}
            </TouchableOpacity>
            <Text style={styles.micTitle}>
              {state === 'listening' ? 'Listening…' : state === 'completed' ? 'Review details' : 'Tap to speak'}
            </Text>
            <Text style={styles.micSub}>
              {state === 'listening'
                ? 'Tap the mic again when done speaking'
                : 'Include contributor name and amount'}
            </Text>
            {transcript && state === 'listening' ? (
              <Text style={styles.liveTranscript}>{transcript}</Text>
            ) : null}
          </View>

          <View style={styles.langBox}>
            <Text style={styles.langLabel}>Recognition Language</Text>
            <View style={styles.langRow}>
              {LANG_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  disabled={state === 'listening' || state === 'processing'}
                  onPress={() => { setLang(opt.value); handleRetry(); }}
                  style={[styles.langChip, lang === opt.value && styles.langChipActive]}
                >
                  <Text style={[styles.langChipText, lang === opt.value && styles.langChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.langHint}>{LANG_OPTIONS.find((o) => o.value === lang)?.hint}</Text>
          </View>

          {transcript && state === 'completed' ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.sectionTitle}>Recognized Text</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          ) : null}

          {state === 'completed' ? (
            <View style={styles.formArea}>
              <Text style={styles.sectionTitle}>Extracted Details</Text>
              <Input label="Contributor Name" value={extracted.guest_name} onChangeText={(v) => setExtracted((p) => ({ ...p, guest_name: v }))} />
              <Input label="Phone" value={extracted.phone} onChangeText={(v) => setExtracted((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
              <Input label="Amount (₹)" value={extracted.amount} onChangeText={(v) => setExtracted((p) => ({ ...p, amount: v }))} keyboardType="numeric" />
              <Input label="Note" value={extracted.note} onChangeText={(v) => setExtracted((p) => ({ ...p, note: v }))} multiline />
            </View>
          ) : null}

          {state !== 'completed' ? (
            <>
              <Input
                label="Or type spoken details"
                placeholder='e.g. "Ravi Kumar gave 1001 rupees"'
                value={manualText}
                onChangeText={setManualText}
                multiline
              />
              <Button title="Parse & Review" onPress={applyManualTranscript} variant="outline" />
            </>
          ) : null}

          {state === 'idle' || state === 'processing' ? (
            <Button title="Start Recording" onPress={startRecording} loading={state === 'processing'} style={{ marginTop: spacing.md }} />
          ) : state === 'listening' ? (
            <Button title="Stop Recording" onPress={stopRecording} style={{ marginTop: spacing.md }} />
          ) : (
            <>
              <Button title={t('saveEntry')} onPress={handleSave} loading={saving} disabled={!canAddMoi} />
              <Button title="Try Again" variant="outline" onPress={handleRetry} style={{ marginTop: spacing.md }} />
            </>
          )}
          <Button title="Manual Entry Instead" variant="outline" onPress={() => navigation.navigate('MoiEntry', { slug })} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </SafeScreen>
    </View>
  );
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  micArea: { alignItems: 'center', paddingVertical: spacing.xl },
  micCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  micActive: { backgroundColor: colors.error },
  micTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  micSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
  liveTranscript: { fontSize: fontSize.sm, color: colors.primary, marginTop: spacing.md, textAlign: 'center', paddingHorizontal: spacing.lg, fontStyle: 'italic' },
  langBox: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  langLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  langRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  langChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  langChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langChipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  langChipTextActive: { color: colors.text, fontWeight: '700' },
  langHint: { fontSize: 10, color: colors.textMuted, fontStyle: 'italic' },
  transcriptBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  transcriptText: { fontSize: fontSize.sm, color: colors.text },
  formArea: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: 'center', backgroundColor: colors.errorBg, padding: spacing.md, borderRadius: radius.md },
});

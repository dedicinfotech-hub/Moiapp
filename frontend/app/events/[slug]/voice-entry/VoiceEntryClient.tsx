'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { eventsApi, moiApi, Event } from '@/lib/api';
import HostEntryShell from '@/components/event/HostEntryShell';
import EventContextCard from '@/components/event/EventContextCard';
import { useSlug } from '@/lib/useSlug';

type RecordingState = 'idle' | 'listening' | 'processing' | 'completed';
type RecognitionLang = 'en-IN' | 'ta-IN';

const LANG_OPTIONS: { value: RecognitionLang; label: string; hint: string }[] = [
  { value: 'en-IN', label: 'English', hint: 'e.g. "Ravi Kumar gave 1001 rupees"' },
  { value: 'ta-IN', label: 'தமிழ்', hint: 'எ.கா. "ரவி குமார் ஆயிரத்து ஒரு ரூபாய் கொடுத்தார்"' },
];

type ExtractedDetails = {
  guest_name: string;
  phone: string;
  amount: string;
  note: string;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
} & {
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResult[];
  resultIndex: number;
  error?: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onabort: (() => void) | null;
};

type SpeechRecognitionConstructor = {
  new (): SpeechRecognitionInstance;
};

type SpeechRecognitionWindow = Window & typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const EMPTY_EXTRACTED: ExtractedDetails = {
  guest_name: '',
  phone: '',
  amount: '',
  note: '',
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeDigits = (value: string) => value.replace(/[^\d]/g, '');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Tamil number words → digits ───────────────────────────────────────────────
// Covers common spoken amounts: நூறு (100) to பத்து லட்சம் (1000000)
const TAMIL_UNITS: Record<string, number> = {
  'பத்து': 10,
  'இருபது': 20, 'இருபத்து': 20,
  'முப்பது': 30, 'முப்பத்து': 30,
  'நாற்பது': 40, 'நாற்பத்து': 40,
  'ஐம்பது': 50, 'ஐம்பத்து': 50,
  'அறுபது': 60, 'அறுபத்து': 60,
  'எழுபது': 70, 'எழுபத்து': 70,
  'எண்பது': 80, 'எண்பத்து': 80,
  'தொண்ணூறு': 90, 'தொண்ணூத்து': 90,
  'நூறு': 100, 'நூத்து': 100,
  'ஐநூறு': 500, 'ஐந்நூறு': 500,
  'ஆயிரம்': 1000, 'ஆயிரத்து': 1000,
  'இரண்டாயிரம்': 2000, 'இரண்டாயிரத்து': 2000,
  'மூவாயிரம்': 3000, 'மூவாயிரத்து': 3000,
  'ஐயாயிரம்': 5000, 'ஐந்தாயிரம்': 5000,
  'பதினாயிரம்': 10000, 'பத்தாயிரம்': 10000,
  'இருபதாயிரம்': 20000,
  'ஐம்பதாயிரம்': 50000,
  'லட்சம்': 100000, 'ஒரு லட்சம்': 100000,
};

// Multiplier words that combine with a leading digit/word:
// "இரண்டு ஆயிரம்" = 2 * 1000 = 2000, "ஐந்து நூறு" = 5 * 100 = 500
const TAMIL_MULTIPLIERS: Record<string, number> = {
  'ஒன்று': 1, 'ஒரு': 1,
  'இரண்டு': 2, 'மூன்று': 3,
  'நான்கு': 4, 'ஐந்து': 5,
  'ஆறு': 6, 'ஏழு': 7,
  'எட்டு': 8, 'ஒன்பது': 9,
  'பத்து': 10, 'பதினொன்று': 11,
  'பன்னிரண்டு': 12, 'பதிமூன்று': 13,
  'பதினான்கு': 14, 'பதினைந்து': 15,
  'பதினாறு': 16, 'பதினேழு': 17,
  'பதினெட்டு': 18, 'பத்தொன்பது': 19,
  'இருபது': 20, 'முப்பது': 30,
  'நாற்பது': 40, 'ஐம்பது': 50,
};

const TAMIL_SCALES: Record<string, number> = {
  'நூறு': 100, 'நூத்து': 100,
  'ஆயிரம்': 1000, 'ஆயிரத்து': 1000,
  'லட்சம்': 100000,
};

/**
 * Convert Tamil number words in a string to their digit equivalents.
 * Returns the numeric value if found, else 0.
 */
function parseTamilAmount(text: string): number {
  const t = normalizeWhitespace(text);

  // 1. Direct lookup (e.g. "ஆயிரம்", "ஐநூறு")
  for (const [word, val] of Object.entries(TAMIL_UNITS)) {
    if (t.includes(word)) {
      // Try "X ஆயிரம்" pattern: find a multiplier before the scale word
      const scaleEntry = Object.entries(TAMIL_SCALES).find(([s]) => word.startsWith(s) || word === s);
      if (scaleEntry) {
        const [scaleWord, scaleVal] = scaleEntry;
        // Look for "multiplier scaleWord" in text
        for (const [mult, multVal] of Object.entries(TAMIL_MULTIPLIERS)) {
          if (t.includes(`${mult} ${scaleWord}`)) {
            return multVal * scaleVal;
          }
        }
      }
      return val;
    }
  }

  // 2. "multiplier scale" pattern not caught above
  for (const [mult, multVal] of Object.entries(TAMIL_MULTIPLIERS)) {
    for (const [scale, scaleVal] of Object.entries(TAMIL_SCALES)) {
      if (t.includes(`${mult} ${scale}`)) return multVal * scaleVal;
    }
  }

  return 0;
}

const cleanName = (value: string) => {
  const withoutIntro = value
    // English intro phrases
    .replace(/\b(this is|my name is|name is|contributor is|guest is)\b/gi, ' ')
    .replace(/\b(has given|had given|gave|paid|contributed|sent|offered)\b.*$/i, ' ')
    .replace(/\b(rupees?|rs\.?|inr)\b/gi, ' ')
    // Tamil: strip amount word and everything after it
    // e.g. "ஆறுமுகம் ஆயிரம் ரூபாய்" → strip "ஆயிரம் ரூபாய்" → "ஆறுமுகம்"
    .replace(/\s*(ஆயிரம்|ஆயிரத்து|நூறு|நூத்து|லட்சம்|ஐநூறு|ஐந்நூறு|பதினாயிரம்|பத்தாயிரம்|இரண்டாயிரம்|மூவாயிரம்|ஐயாயிரம்|ஐந்தாயிரம்).*$/, ' ')
    .replace(/\s*(கொடுத்தார்|கொடுத்தாள்|கொடுக்கிறார்|கொடுக்கிறாள்|ரூபாய்|மொய்|கொடுத்த).*$/, ' ')
    .replace(/[^A-Za-z0-9\u0600-\u06FF\u0900-\u0D7F\s.'-]/g, ' ');

  return normalizeWhitespace(withoutIntro).replace(/[.]+$/g, '').slice(0, 80);
};

const extractAmount = (text: string) => {
  const amountPatterns = [
    // English / digit patterns
    /\b(?:rupees?|rs\.?|₹|inr)\s*([₹\s,\d]+(?:\.\d{1,2})?)/i,
    /\b([₹\s,\d]+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|₹|inr|ரூபாய்)\b/i,
    /\b(?:gave|given|paid|contributed|sent|offered)\s*[a-z\s,]*?([₹\s,\d]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const digits = normalizeDigits(match[1]);
      if (digits) return digits;
    }
  }

  // Fallback: any digit sequence in the text
  const fallbackMatch = text.match(/\b(\d[\d,]*(?:\.\d{1,2})?)\b/);
  if (fallbackMatch) return normalizeDigits(fallbackMatch[1]);

  // Tamil word numbers: e.g. "ஆயிரம்" → "1000", "ஐந்து ஆயிரம்" → "5000"
  const tamilVal = parseTamilAmount(text);
  if (tamilVal > 0) return String(tamilVal);

  return '';
};

const extractPhone = (text: string) => {
  const phoneMatches = text.match(/\b(\d[\d\s-]{8,12}\d)\b/g) ?? [];

  for (const match of phoneMatches) {
    const digits = normalizeDigits(match);
    if (digits.length >= 10) return digits.slice(-10);
  }

  return '';
};

const extractName = (text: string, amount: string) => {
  // English verb patterns
  const verbMatch = text.match(/^(.*?)\s+(?:has given|had given|gave|paid|contributed|sent|offered)\b/i);
  if (verbMatch) return cleanName(verbMatch[1]);

  // Tamil verb patterns: "நாமா கொடுத்தார்" → extract before கொடுத்தார்
  const tamilVerbMatch = text.match(/^(.*?)\s+(?:கொடுத்தார்|கொடுத்தாள்|கொடுக்கிறார்|கொடுக்கிறாள்|கொடுத்த)/);
  if (tamilVerbMatch) return cleanName(tamilVerbMatch[1]);

  if (amount) {
    const amountIndex = text.search(new RegExp(`${escapeRegExp(amount)}\\s*(?:rupees?|rs\\.?|₹|inr|ரூபாய்)?`, 'i'));
    if (amountIndex > 0) return cleanName(text.slice(0, amountIndex));
  }

  return cleanName(text);
};

const extractDetails = (text: string): ExtractedDetails => {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return EMPTY_EXTRACTED;

  const amount = extractAmount(normalized);

  return {
    guest_name: extractName(normalized, amount),
    phone: extractPhone(normalized),
    amount,
    note: normalized,
  };
};

const getRecognitionErrorMessage = (error?: string) => {
  switch (error) {
    case 'no-speech':
      return 'No speech was detected. Try again and speak a little closer to the microphone.';
    case 'audio-capture':
      return 'No microphone was found. Please connect a microphone and try again.';
    case 'not-allowed':
      return 'Microphone permission was blocked. Please allow microphone access and try again.';
    case 'network':
      return 'Speech recognition needs a network connection. Please check your connection and try again.';
    default:
      return 'Speech recognition failed. Please try again.';
  }
};

export default function VoiceEntryScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/voice-entry → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [lang, setLang] = useState<RecognitionLang>('en-IN');
  const [timer, setTimer] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState<ExtractedDetails>(EMPTY_EXTRACTED);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recordingStateRef = useRef<RecordingState>('idle');
  const transcriptRef = useRef('');

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const cleanupRecognition = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    recognitionRef.current = null;
  };

  const handleExtractedChange = (key: keyof ExtractedDetails, value: string) => {
    setExtracted((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      try {
        const data = await eventsApi.get(slug);
        setEvent(data);
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();

    return () => {
      cleanupRecognition();
    };
  }, [slug, router]);

  const startRecording = async () => {
    if (recordingStateRef.current === 'listening' || recordingStateRef.current === 'processing') {
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setRecordingState('idle');
      return;
    }

    setError('');
    setRecordingState('processing');

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          setError('Microphone access is blocked. Please enable it in your browser settings to use voice entry.');
          setRecordingState('idle');
          return;
        }
      } catch {
        // permissions.query not supported, proceed anyway
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access to use voice entry.');
        setRecordingState('idle');
        return;
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
        setRecordingState('idle');
        return;
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setRecordingState('listening');
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalTranscript += `${event.results[i][0]?.transcript ?? ''} `;
        }
      }

      const normalized = normalizeWhitespace(finalTranscript);
      if (!normalized) return;

      transcriptRef.current = normalized;
      setTranscript(normalized);
      setExtracted(extractDetails(normalized));
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(getRecognitionErrorMessage(event.error));
      }

      cleanupRecognition();
      setRecordingState('idle');
    };

    recognition.onabort = () => {
      cleanupRecognition();
    };

    recognition.onend = () => {
      const wasListening = recordingStateRef.current === 'listening';
      cleanupRecognition();

      if (wasListening) {
        if (transcriptRef.current) {
          setExtracted(extractDetails(transcriptRef.current));
        }
        setRecordingState('completed');
      } else {
        setRecordingState('idle');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      cleanupRecognition();
      setRecordingState('idle');
      setError('Speech recognition could not start. Please try again.');
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    cleanupRecognition();
    recordingStateRef.current = 'idle';

    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Recognition may already be stopped by the browser.
      }
    }

    setRecordingState('idle');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    setError('');
    try {
      await moiApi.add({
        event_id: event.id,
        guest_name: extracted.guest_name || 'Voice Entry',
        relation: 'other',
        amount: Number(extracted.amount) || 0,
        gift_type: 'cash',
        payment_mode: 'cash',
        note: extracted.note || transcript,
        entered_by: 'voice_entry',
      });
      router.push(`/events/${slug}/entries`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    transcriptRef.current = '';
    setRecordingState('idle');
    setTranscript('');
    setExtracted(EMPTY_EXTRACTED);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
          <p className="text-[#666] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Event not found</p>
      </div>
    );
  }

  return (
    <HostEntryShell slug={slug} title="Voice Entry" subtitle="Speak the contributor details and amount. We'll convert it to text for you to review and save." activeTab="voice" onBack={() => router.push(`/events/${slug}/entries`)} sidebarOverride="closed">
      <EventContextCard event={event} icon="calendar" detailsHref={`/events/${slug}/dashboard`} />
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <div className="flex flex-col items-center py-6 mb-4">
        {recordingState === 'listening' && (
          <div className="flex items-end gap-0.5 h-12 mb-4">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="w-1 bg-[#FFC107] rounded-full animate-pulse" style={{ height: `${12 + (i % 5) * 6}px`, animationDelay: `${i * 0.04}s` }} />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={recordingState === 'listening' ? stopRecording : startRecording}
          disabled={recordingState === 'processing'}
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-all ${recordingState === 'listening' ? 'bg-tn-yellow text-white shadow-lg shadow-tn-yellow/30' : 'bg-tn-yellow text-white'}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
        </button>
        <p className="text-sm font-bold text-[#FFC107]">{recordingState === 'listening' ? 'Listening...' : recordingState === 'completed' ? 'Done' : 'Tap to speak'}</p>
        <p className="text-xs text-[#6B7280] mt-1">{recordingState === 'listening' ? 'Tap stop when you\'re done speaking.' : 'Include name and amount.'}</p>
        {(recordingState === 'listening' || recordingState === 'completed') && (
          <p className="text-2xl font-bold text-[#FFC107] mt-3">{formatTime(timer)}</p>
        )}
      </div>

      <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-xl p-3 mb-5">
        {/* Language selector */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#FFC107]">🎙️ Recognition Language</p>
          <div className="flex bg-white border border-[#EDE9FE] rounded-lg p-0.5 gap-0.5">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={recordingState === 'listening' || recordingState === 'processing'}
                onClick={() => { setLang(opt.value); handleRetry(); }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors disabled:opacity-50 ${
                  lang === opt.value
                    ? 'bg-[#FFC107] text-white'
                    : 'text-[#6B7280] hover:text-[#FFC107]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-[#6B7280] italic">
          {LANG_OPTIONS.find(o => o.value === lang)?.hint}
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-1.5">💡 Speak clearly · Include name and amount</p>
      </div>

      {transcript && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#1F2937]">Recognized Text</h3>
            <button type="button" onClick={handleRetry} className="text-[10px] text-[#EF4444] font-semibold">Clear</button>
          </div>
          <p className="text-sm text-[#374151]">{transcript}</p>
          <p className="text-[10px] text-[#22C55E] font-semibold mt-2">Confidence: High</p>
        </div>
      )}

      {(recordingState === 'completed' || transcript || Object.values(extracted).some(Boolean)) && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-bold text-[#1F2937] mb-3">Extracted Details (Review before saving)</h3>
          {[
            { label: 'Contributor Name', key: 'guest_name' as const },
            { label: 'Phone Number', key: 'phone' as const },
            { label: 'Amount (₹)', key: 'amount' as const, raw: true },
          ].map((row) => (
            <div key={row.key} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-tn-gold text-sm"><Icon name="users" size={16} /></div>
              <div className="flex-1">
                <p className="text-[10px] text-[#6B7280]">{row.label}</p>
                {row.raw ? (
                  <input value={extracted[row.key]} onChange={(e) => handleExtractedChange(row.key, e.target.value)} className="text-sm font-semibold text-[#1F2937] bg-transparent w-full outline-none" />
                ) : (
                  <input value={extracted[row.key]} onChange={(e) => handleExtractedChange(row.key, e.target.value)} className="text-sm font-semibold text-[#1F2937] bg-transparent w-full outline-none" />
                )}
              </div>
            </div>
          ))}
          <div className="bg-[#F5F3FF] rounded-lg p-2 mt-3 flex gap-2">
            <Icon name="list" size={16} />
            <p className="text-[10px] text-[#FFC107]">Please review the details above. You can edit any field before saving.</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={() => router.push(`/events/${slug}/moi-entry`)} className="flex-1 h-12 border-2 border-[#FFC107] text-[#FFC107] rounded-xl font-semibold text-sm">Edit Details</button>
        <button type="button" onClick={handleSave} disabled={saving || !extracted.guest_name} className="flex-1 h-12 bg-[#FFC107] text-white rounded-xl font-semibold text-sm disabled:opacity-40">
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </HostEntryShell>
  );
}

export interface ExtractedVoiceDetails {
  guest_name: string;
  phone: string;
  amount: string;
  note: string;
}

export const EMPTY_EXTRACTED: ExtractedVoiceDetails = {
  guest_name: '',
  phone: '',
  amount: '',
  note: '',
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();
const normalizeDigits = (value: string) => value.replace(/[^\d]/g, '');
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const TAMIL_MULTIPLIERS: Record<string, number> = {
  'ஒன்று': 1, 'ஒரு': 1,
  'இரண்டு': 2, 'மூன்று': 3,
  'நான்கு': 4, 'ஐந்து': 5,
  'ஆறு': 6, 'ஏழு': 7,
  'எட்டு': 8, 'ஒன்பது': 9,
  'பத்து': 10,
};

const TAMIL_SCALES: Record<string, number> = {
  'நூறு': 100, 'நூத்து': 100,
  'ஆயிரம்': 1000, 'ஆயிரத்து': 1000,
  'லட்சம்': 100000,
};

function parseTamilAmount(text: string): number {
  const t = normalizeWhitespace(text);

  for (const [word, val] of Object.entries(TAMIL_UNITS)) {
    if (t.includes(word)) {
      const scaleEntry = Object.entries(TAMIL_SCALES).find(([s]) => word.startsWith(s) || word === s);
      if (scaleEntry) {
        const [scaleWord, scaleVal] = scaleEntry;
        for (const [mult, multVal] of Object.entries(TAMIL_MULTIPLIERS)) {
          if (t.includes(`${mult} ${scaleWord}`)) return multVal * scaleVal;
        }
      }
      return val;
    }
  }

  for (const [mult, multVal] of Object.entries(TAMIL_MULTIPLIERS)) {
    for (const [scale, scaleVal] of Object.entries(TAMIL_SCALES)) {
      if (t.includes(`${mult} ${scale}`)) return multVal * scaleVal;
    }
  }

  return 0;
}

const cleanName = (value: string) => {
  const withoutIntro = value
    .replace(/\b(this is|my name is|name is|contributor is|guest is)\b/gi, ' ')
    .replace(/\b(has given|had given|gave|paid|contributed|sent|offered)\b.*$/i, ' ')
    .replace(/\b(rupees?|rs\.?|inr)\b/gi, ' ')
    .replace(/\s*(ஆயிரம்|ஆயிரத்து|நூறு|நூத்து|லட்சம்|ஐநூறு|ஐந்நூறு|பதினாயிரம்|பத்தாயிரம்|இரண்டாயிரம்|மூவாயிரம்|ஐயாயிரம்|ஐந்தாயிரம்).*$/, ' ')
    .replace(/\s*(கொடுத்தார்|கொடுத்தாள்|கொடுக்கிறார்|கொடுக்கிறாள்|ரூபாய்|மொய்|கொடுத்த).*$/, ' ')
    .replace(/[^A-Za-z0-9\u0900-\u0D7F\s.'-]/g, ' ');

  return normalizeWhitespace(withoutIntro).replace(/[.]+$/g, '').slice(0, 80);
};

const extractAmount = (text: string) => {
  const amountPatterns = [
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

  const fallbackMatch = text.match(/\b(\d[\d,]*(?:\.\d{1,2})?)\b/);
  if (fallbackMatch) return normalizeDigits(fallbackMatch[1]);

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

export type VoiceExtractMode = 'en' | 'ta' | 'tanglish';

const TANGLISH_UNITS: Record<string, number> = {
  ayiram: 1000,
  aayiram: 1000,
  aiyiram: 1000,
  nooru: 100,
  noorru: 100,
  latcham: 100000,
  lakhs: 100000,
  lakh: 100000,
  pathu: 10,
  irupathu: 20,
  muppathu: 30,
  naalpathu: 40,
  ambathu: 50,
};

function parseTanglishAmount(text: string): number {
  const t = normalizeWhitespace(text).toLowerCase();

  const digitMatch = t.match(/\b(\d[\d,]*)\s*(?:roopa|roopai|rupees?|rs\.?|rupa|moi)\b/i);
  if (digitMatch) return parseInt(normalizeDigits(digitMatch[1]), 10);

  for (const [word, val] of Object.entries(TANGLISH_UNITS)) {
    if (t.includes(word)) return val;
  }

  const tamilVal = parseTamilAmount(text);
  if (tamilVal > 0) return tamilVal;

  return 0;
}

const extractTanglishName = (text: string, amount: string) => {
  const tanglishVerbMatch = text.match(
    /^(.*?)\s+(?:koduthar|koduthan|kudutharu|kuduthan|kudichan|kudicharu|gave|given|paid|contributed|sent|offered|கொடுத்தார்|கொடுத்தாள்|கொடுத்த)/i
  );
  if (tanglishVerbMatch) return cleanName(tanglishVerbMatch[1]);
  return extractName(text, amount);
};

const extractName = (text: string, amount: string) => {
  const verbMatch = text.match(/^(.*?)\s+(?:has given|had given|gave|paid|contributed|sent|offered)\b/i);
  if (verbMatch) return cleanName(verbMatch[1]);

  const tamilVerbMatch = text.match(/^(.*?)\s+(?:கொடுத்தார்|கொடுத்தாள்|கொடுக்கிறார்|கொடுக்கிறாள்|கொடுத்த)/);
  if (tamilVerbMatch) return cleanName(tamilVerbMatch[1]);

  if (amount) {
    const amountIndex = text.search(new RegExp(`${escapeRegExp(amount)}\\s*(?:rupees?|rs\\.?|₹|inr|ரூபாய்)?`, 'i'));
    if (amountIndex > 0) return cleanName(text.slice(0, amountIndex));
  }

  return cleanName(text);
};

const extractAmountForMode = (text: string, mode: VoiceExtractMode) => {
  if (mode === 'tanglish') {
    const tanglishVal = parseTanglishAmount(text);
    if (tanglishVal > 0) return String(tanglishVal);
  }
  return extractAmount(text);
};

export function extractVoiceDetails(text: string, mode: VoiceExtractMode = 'en'): ExtractedVoiceDetails {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return EMPTY_EXTRACTED;

  const amount = extractAmountForMode(normalized, mode);
  const guest_name =
    mode === 'tanglish' ? extractTanglishName(normalized, amount) : extractName(normalized, amount);
  return {
    guest_name,
    phone: extractPhone(normalized),
    amount,
    note: normalized,
  };
}

export function getRecognitionErrorMessage(error?: string) {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Try again and speak closer to the microphone.';
    case 'audio-capture':
      return 'No microphone found. Connect a microphone and try again.';
    case 'not-allowed':
      return 'Microphone permission blocked. Allow microphone access and try again.';
    case 'network':
      return 'Speech recognition needs a network connection.';
    default:
      return 'Speech recognition failed. Try again or type the details below.';
  }
}

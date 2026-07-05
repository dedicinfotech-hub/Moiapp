#!/usr/bin/env node
/**
 * Sync web frontend translations from mobile/src/i18n (en, ta, hi).
 * Run from repo root:  node scripts/sync-web-i18n.mjs
 * Run from frontend/: npm run sync-i18n
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const translationsPath = path.join(root, 'mobile/src/i18n/translations.ts');
const hiPath = path.join(root, 'mobile/src/i18n/hiTranslations.ts');
const outPath = path.join(root, 'frontend/lib/translations/index.ts');

function parseKeyValues(source) {
  const obj = {};
  const re = /^\s+(\w+):\s+'((?:\\'|[^'])*)'/gm;
  let m;
  while ((m = re.exec(source))) {
    obj[m[1]] = m[2].replace(/\\'/g, "'");
  }
  return obj;
}

function extractBlock(source, startMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return '';
  let i = source.indexOf('{', start) + 1;
  let depth = 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    i++;
  }
  return source.slice(source.indexOf('{', start) + 1, i - 1);
}

const translationsSrc = fs.readFileSync(translationsPath, 'utf8');
const hiSrc = fs.readFileSync(hiPath, 'utf8');

const en = parseKeyValues(extractBlock(translationsSrc, 'en: {'));
const ta = parseKeyValues(extractBlock(translationsSrc, 'ta: {'));
const hi = parseKeyValues(extractBlock(hiSrc, 'export const hiTranslations'));

/** Web-only strings (home, navbar, auth extras). */
const webExtra = {
  homeHeroBadge: {
    en: 'Tamil Wedding Gift Tracker',
    ta: 'தமிழ் திருமண பரிசு பதிவு',
    hi: 'तमिल शादी उपहार ट्रैकर',
  },
  homeHeroTitle1: {
    en: 'Create your wedding page.',
    ta: 'உங்கள் திருமண பக்கத்தை உருவாக்குங்கள்.',
    hi: 'अपना शादी पेज बनाएं.',
  },
  homeHeroTitle2a: {
    en: 'Track every ',
    ta: 'ஒவ்வொரு ',
    hi: 'हर ',
  },
  homeHeroTitle2b: {
    en: ' gift.',
    ta: ' பரிசையும் பதிவு செய்யுங்கள்.',
    hi: ' उपहार ट्रैक करें.',
  },
  homeHeroTitle3: {
    en: 'Share with family.',
    ta: 'குடும்பத்துடன் பகிருங்கள்.',
    hi: 'परिवार के साथ साझा करें.',
  },
  homeHeroSub: {
    en: 'A simple platform to record wedding moi online.',
    ta: 'இணையவழி மொய் பதிவு செய்ய ஒரு எளிய தளம்.',
    hi: 'ऑनलाइन शादी मोई दर्ज करने का सरल प्लेटफ़ॉर्म.',
  },
  listYourWedding: {
    en: 'List Your Wedding',
    ta: 'உங்கள் திருமணத்தை பதிவு செய்யுங்கள்',
    hi: 'अपनी शादी सूचीबद्ध करें',
  },
  listEvent: {
    en: 'List Event',
    ta: 'நிகழ்வை பதிவு செய்',
    hi: 'कार्यक्रम सूचीबद्ध करें',
  },
  simpleProcess: {
    en: 'Simple Process',
    ta: 'எளிய செயல்முறை',
    hi: 'सरल प्रक्रिया',
  },
  howItWorksTitle: {
    en: 'How Moi PassBook works',
    ta: 'Moi PassBook எப்படி வேலை செய்கிறது',
    hi: 'Moi PassBook कैसे काम करता है',
  },
  forGuests: {
    en: 'For Guests',
    ta: 'விருந்தினர்களுக்கு',
    hi: 'अतिथियों के लिए',
  },
  forOrganizers: {
    en: 'For Couples / Organizers',
    ta: 'தம்பதிகள் / ஒருங்கிணைப்பாளர்களுக்கு',
    hi: 'जोड़ों / आयोजकों के लिए',
  },
  myProfile: {
    en: 'My Profile',
    ta: 'என் சுயவிவரம்',
    hi: 'मेरी प्रोफ़ाइल',
  },
  import: { en: 'Import', ta: 'இறக்குமதி', hi: 'आयात' },
  create: { en: 'Create', ta: 'உருவாக்கு', hi: 'बनाएं' },
  loadingEvent: {
    en: 'Loading event…',
    ta: 'நிகழ்வு ஏற்றுகிறது…',
    hi: 'कार्यक्रम लोड हो रहा है…',
  },
  eventNotFound: {
    en: 'Event not found',
    ta: 'நிகழ்வு கிடைக்கவில்லை',
    hi: 'कार्यक्रम नहीं मिला',
  },
  giveMoiNow: {
    en: 'Give Moi Now',
    ta: 'இப்போது மொய் கொடுங்கள்',
    hi: 'अभी मोई दें',
  },
  phoneLogin: {
    en: 'Phone Login',
    ta: 'தொலைபேசி உள்நுழைவு',
    hi: 'फ़ोन लॉगिन',
  },
  emailLogin: {
    en: 'Email Login',
    ta: 'மின்னஞ்சல் உள்நுழைவு',
    hi: 'ईमेल लॉगिन',
  },
  verifyAndSignIn: {
    en: 'Verify & Sign In',
    ta: 'சரிபார்த்து உள்நுழையுங்கள்',
    hi: 'सत्यापित करें और साइन इन करें',
  },
  confirmPassword: {
    en: 'Confirm Password',
    ta: 'கடவுச்சொல்லை உறுதிப்படுத்து',
    hi: 'पासवर्ड की पुष्टि करें',
  },
  fullName: { en: 'Full Name', ta: 'முழு பெயர்', hi: 'पूरा नाम' },
  guestStepOpenLink: {
    en: 'Open Shared Link',
    ta: 'பகிரப்பட்ட இணைப்பைத் திறக்கவும்',
    hi: 'साझा लिंक खोलें',
  },
  guestStepOpenLinkDesc: {
    en: 'Use the wedding link or QR code shared by the host.',
    ta: 'நிகழ்வு நடத்துபவர் பகிர்ந்த திருமண இணைப்பு அல்லது QR குறியீட்டைப் பயன்படுத்துங்கள்.',
    hi: 'मेज़बान द्वारा साझा शादी लिंक या QR कोड का उपयोग करें।',
  },
  guestStepViewDetails: {
    en: 'View Details',
    ta: 'விவரங்களைப் பார்க்கவும்',
    hi: 'विवरण देखें',
  },
  guestStepViewDetailsDesc: {
    en: 'See date, venue, couple details, photos and map.',
    ta: 'தேதி, இடம், தம்பதி விவரங்கள், புகைப்படங்கள் மற்றும் வரைபடத்தைப் பாருங்கள்.',
    hi: 'तारीख, स्थान, जोड़े का विवरण, फ़ोटो और नक्शा देखें।',
  },
  guestStepGiveMoi: {
    en: 'Give Moi',
    ta: 'மொய் கொடுங்கள்',
    hi: 'मोई दें',
  },
  guestStepGiveMoiDesc: {
    en: 'Enter your name, amount and pay via UPI or cash.',
    ta: 'உங்கள் பெயர், தொகையை உள்ளிட்டு UPI அல்லது பணம் மூலம் செலுத்துங்கள்.',
    hi: 'अपना नाम, राशि दर्ज करें और UPI या नकद से भुगतान करें।',
  },
  orgStepCreateAccount: {
    en: 'Create Account',
    ta: 'கணக்கு உருவாக்கு',
    hi: 'खाता बनाएं',
  },
  orgStepCreateAccountDesc: {
    en: 'Register and create your wedding event in minutes.',
    ta: 'பதிவு செய்து நிமிடங்களில் உங்கள் திருமண நிகழ்வை உருவாக்குங்கள்.',
    hi: 'पंजीकरण करें और मिनटों में अपना शादी कार्यक्रम बनाएं।',
  },
  orgStepUploadShare: {
    en: 'Upload & Share',
    ta: 'பதிவேற்றி பகிருங்கள்',
    hi: 'अपलोड और साझा करें',
  },
  orgStepUploadShareDesc: {
    en: 'Add cover photo, share the link — no login needed for guests.',
    ta: 'அட்டைப் படம் சேர்த்து இணைப்பைப் பகிருங்கள் — விருந்தினர்களுக்கு உள்நுழைவு தேவையில்லை.',
    hi: 'कवर फ़ोटो जोड़ें, लिंक साझा करें — अतिथियों को लॉगिन की जरूरत नहीं।',
  },
  orgStepTrackExport: {
    en: 'Track & Export',
    ta: 'கண்காணித்து ஏற்றுமதி செய்',
    hi: 'ट्रैक और निर्यात',
  },
  orgStepTrackExportDesc: {
    en: 'Dashboard shows who paid, totals, and CSV export.',
    ta: 'டாஷ்போர்டில் யார் செலுத்தினர், மொத்தம், CSV ஏற்றுமதி காட்டப்படும்.',
    hi: 'डैशबोर्ड दिखाता है किसने भुगतान किया, कुल राशि, और CSV निर्यात।',
  },
  linkExpiredWhy: {
    en: 'Why did this happen?',
    ta: 'ஏன் இது நடந்தது?',
    hi: 'ऐसा क्यों हुआ?',
  },
  linkExpiredWhySub: {
    en: 'For your security, invitation links are valid only for a limited time. Please contact the host to get a new link.',
    ta: 'உங்கள் பாதுகாப்புக்காக, அழைப்பு இணைப்புகள் வரையறுக்கப்பட்ட காலத்திற்கு மட்டுமே செல்லுபடியாகும். புதிய இணைப்புக்கு நிகழ்வு நடத்துநரை தொடர்பு கொள்ளுங்கள்.',
    hi: 'आपकी सुरक्षा के लिए, निमंत्रण लिंक सीमित समय के लिए ही मान्य होते हैं। नया लिंक पाने के लिए मेज़बान से संपर्क करें।',
  },
  passwordsDoNotMatch: {
    en: 'Passwords do not match',
    ta: 'கடவுச்சொற்கள் பொருந்தவில்லை',
    hi: 'पासवर्ड मेल नहीं खाते',
  },
  creatingAccount: {
    en: 'Creating account…',
    ta: 'கணக்கு உருவாக்குகிறது…',
    hi: 'खाता बनाया जा रहा है…',
  },
  sendResetLink: {
    en: 'Send Reset Link',
    ta: 'மீட்டமைப்பு இணைப்பை அனுப்பு',
    hi: 'रीसेट लिंक भेजें',
  },
  rememberPassword: {
    en: 'Remember your password?',
    ta: 'கடவுச்சொல் நினைவில் உள்ளதா?',
    hi: 'पासवर्ड याद है?',
  },
  forgotPasswordSub: {
    en: 'Enter your email to reset your password',
    ta: 'கடவுச்சொல்லை மீட்டமைக்க உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    hi: 'पासवर्ड रीसेट करने के लिए अपना ईमेल दर्ज करें',
  },
  resetPassword: {
    en: 'Reset Password',
    ta: 'கடவுச்சொல்லை மீட்டமை',
    hi: 'पासवर्ड रीसेट करें',
  },
  resetPasswordSub: {
    en: 'Enter your new password',
    ta: 'உங்கள் புதிய கடவுச்சொல்லை உள்ளிடவும்',
    hi: 'अपना नया पासवर्ड दर्ज करें',
  },
  newPassword: {
    en: 'New Password',
    ta: 'புதிய கடவுச்சொல்',
    hi: 'नया पासवर्ड',
  },
  invalidResetLink: {
    en: 'Invalid Link',
    ta: 'தவறான இணைப்பு',
    hi: 'अमान्य लिंक',
  },
  invalidResetLinkSub: {
    en: 'The password reset link is invalid or has expired',
    ta: 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு தவறானது அல்லது காலாவதியானது',
    hi: 'पासवर्ड रीसेट लिंक अमान्य है या समाप्त हो गया है',
  },
  requestNewResetLink: {
    en: 'Request a new reset link',
    ta: 'புதிய மீட்டமைப்பு இணைப்பை கோருங்கள்',
    hi: 'नया रीसेट लिंक अनुरोध करें',
  },
  resetting: {
    en: 'Resetting…',
    ta: 'மீட்டமைக்கிறது…',
    hi: 'रीसेट हो रहा है…',
  },
  backToSignIn: {
    en: 'Back to Sign In',
    ta: 'உள்நுழைவுக்குத் திரும்பு',
    hi: 'साइन इन पर वापस',
  },
  phoneOptional: {
    en: '(optional)',
    ta: '(விருப்பம்)',
    hi: '(वैकल्पिक)',
  },
  continueToPayment: {
    en: 'Continue to Payment',
    ta: 'கட்டணத்திற்கு தொடரவும்',
    hi: 'भुगतान पर जारी रखें',
  },
  pleaseWait: {
    en: 'Please wait…',
    ta: 'தயவுசெய்து காத்திருக்கவும்…',
    hi: 'कृपया प्रतीक्षा करें…',
  },
  eventNotFoundOrExpired: {
    en: 'Event not found or link expired',
    ta: 'நிகழ்வு கிடைக்கவில்லை அல்லது இணைப்பு காலாவதி',
    hi: 'कार्यक्रम नहीं मिला या लिंक समाप्त',
  },
  guestFormHintOptional: {
    en: 'Only the gift amount is required. Other fields are optional.',
    ta: 'பரிசு தொகை மட்டும் தேவை. மற்ற புலங்கள் விருப்பம்.',
    hi: 'केवल उपहार राशि आवश्यक है। अन्य फ़ील्ड वैकल्पिक हैं।',
  },
  dashTotalEvents: {
    en: 'Total Events',
    ta: 'மொத்த நிகழ்வுகள்',
    hi: 'कुल कार्यक्रम',
  },
  dashTotalCash: {
    en: 'Total Cash',
    ta: 'மொத்த பணம்',
    hi: 'कुल नकद',
  },
  dashTotalGold: {
    en: 'Total Gold',
    ta: 'மொத்த தங்கம்',
    hi: 'कुल सोना',
  },
  dashTotalGifts: {
    en: 'Total Gifts',
    ta: 'மொத்த பரிசுகள்',
    hi: 'कुल उपहार',
  },
  dashTotalGuests: {
    en: 'Total Guests',
    ta: 'மொத்த விருந்தினர்கள்',
    hi: 'कुल अतिथि',
  },
  dashAvgCashGift: {
    en: 'Avg Cash Gift',
    ta: 'சராசரி பணப் பரிசு',
    hi: 'औसत नकद उपहार',
  },
  dashRecentMoiEntries: {
    en: 'Recent Moi Entries',
    ta: 'சமீப மொய் பதிவுகள்',
    hi: 'हाल की मोई प्रविष्टियाँ',
  },
  dashRecentFunctions: {
    en: 'Recent Functions',
    ta: 'சமீப நிகழ்வுகள்',
    hi: 'हाल के कार्यक्रम',
  },
  appSettings: {
    en: 'App Settings',
    ta: 'ஆப் அமைப்புகள்',
    hi: 'ऐप सेटिंग्स',
  },
  // Snake_case aliases for existing dashboard keys
  mod_dashboard_sub: null,
  mod_events_sub: null,
  mod_organizers_sub: null,
  mod_moi_notebook_sub: null,
  mod_users_sub: null,
  mod_analytics_sub: null,
  mod_features_sub: null,
  mod_settings_sub: null,
  mod_admin_dashboard_sub: null,
  mod_admin_users_sub: null,
  mod_admin_analytics_sub: null,
  mod_admin_revenue_sub: null,
  mod_admin_support_sub: null,
  mod_admin_approvals_sub: null,
  mod_admin_private_events_sub: null,
  mod_admin_login_logs_sub: null,
  moi_notebook: null,
  admin_dashboard: null,
  admin_users: null,
  admin_analytics: null,
  admin_revenue: null,
  admin_support: null,
  admin_approvals: null,
  admin_private_events: null,
  admin_login_logs: null,
  functions: null,
  resend_otp: null,
  send_otp: null,
  verify_otp: null,
  enter_otp: null,
  signup: null,
  already_have_account: null,
  your_data_is_safe: null,
  get_started: null,
  wedding: null,
  birthday: null,
  engagement: null,
  housewarming: null,
  graduation: null,
  custom: null,
  new_event: null,
  past_event: null,
  moi_entry: null,
  add_entry: null,
  guest_name: null,
  payment_method: null,
  export_pdf: null,
  export_excel: null,
  total_collection: null,
  average: null,
  english: null,
  tamil: null,
  hindi: null,
  font_size: null,
  delete_account: null,
  section_admin: null,
  create_function: null,
  total_functions: null,
  total_moi: null,
  pending_returns: null,
  total_contributors: null,
  guest_payments: null,
  event_type: null,
  date: null,
  venue: null,
  city: null,
  card: null,
  cheque: null,
  gift: null,
  other: null,
  upi: null,
  app_name: null,
  loading: null,
  edit: null,
  submit: null,
  back: null,
  filter: null,
  all: null,
  yes: null,
  no: null,
  logout: null,
  otp: null,
  moi_list: null,
  more: null,
  welcome: null,
  organizers: null,
  guests: null,
};

const aliasMap = {
  mod_dashboard_sub: 'modDashboardSub',
  mod_events_sub: 'modEventsSub',
  mod_organizers_sub: 'modOrganizersSub',
  mod_moi_notebook_sub: 'modMoiNotebookSub',
  mod_users_sub: 'modUsersSub',
  mod_analytics_sub: 'modAnalyticsSub',
  mod_features_sub: 'modFeaturesSub',
  mod_settings_sub: 'modSettingsSub',
  mod_admin_dashboard_sub: 'modAdminDashboardSub',
  mod_admin_users_sub: 'modAdminUsersSub',
  mod_admin_analytics_sub: 'modAdminAnalyticsSub',
  mod_admin_revenue_sub: 'modAdminRevenueSub',
  mod_admin_support_sub: 'modAdminSupportSub',
  mod_admin_approvals_sub: 'modAdminApprovalsSub',
  mod_admin_private_events_sub: 'modAdminPrivateEventsSub',
  mod_admin_login_logs_sub: 'modAdminLoginLogsSub',
  moi_notebook: 'modMoiNotebook',
  admin_dashboard: 'modAdminDashboard',
  admin_users: 'modAdminUsers',
  admin_analytics: 'modAdminAnalytics',
  admin_revenue: 'modAdminRevenue',
  admin_support: 'modAdminSupport',
  admin_approvals: 'modAdminApprovals',
  admin_private_events: 'modAdminPrivateEvents',
  admin_login_logs: 'modAdminLoginLogs',
  functions: 'modEvents',
  resend_otp: 'resendOtp',
  send_otp: 'sendOtp',
  verify_otp: 'verifyOtp',
  enter_otp: 'otpSubtitle',
  signup: 'register',
  already_have_account: 'haveAccount',
  your_data_is_safe: 'guestPrivacyNote',
  get_started: 'continue',
  wedding: 'evtWedding',
  birthday: 'evtBirthday',
  engagement: 'evtEngagement',
  housewarming: 'evtHousewarming',
  graduation: 'evtGraduation',
  custom: 'evtOthers',
  new_event: 'newEvent',
  past_event: 'pastEvent',
  moi_entry: 'moiEntry',
  add_entry: 'addMoi',
  guest_name: 'lblFullName',
  payment_method: 'selectPaymentMethod',
  export_pdf: 'emailPdfReport',
  export_excel: 'exportCsv',
  total_collection: 'totalCollection',
  average: 'avgPerEntry',
  english: 'english',
  tamil: 'tamil',
  hindi: 'hindi',
  font_size: 'fontSize',
  delete_account: 'deleteAccount',
  section_admin: 'sectionAdmin',
  create_function: 'createFunction',
  total_functions: 'totalFunctions',
  total_moi: 'totalMoi',
  pending_returns: 'pendingReturns',
  total_contributors: 'totalContributors',
  guest_payments: 'guestPaymentPage',
  event_type: 'chooseEventType',
  date: 'dateTimeLabel',
  venue: 'evtVenue',
  city: 'lblCity',
  card: 'card',
  cheque: 'cheque',
  gift: 'gift',
  other: 'others',
  upi: 'upi',
  app_name: 'appName',
  loading: 'loading',
  edit: 'edit',
  submit: 'submit',
  back: 'back',
  filter: 'filter',
  all: 'allPayments',
  yes: 'yes',
  no: 'no',
  logout: 'signOut',
  otp: 'verifyOtp',
  moi_list: 'moiNotebook',
  more: 'more',
  welcome: 'welcome',
  organizers: 'modOrganizers',
  guests: 'modUsers',
};

// Add appName to en if missing
en.appName = en.appName || 'Moi PassBook';
ta.appName = ta.appName || 'Moi PassBook';
hi.appName = hi.appName || 'Moi PassBook';
en.loading = en.loading || 'Loading…';
ta.loading = ta.loading || 'ஏற்றுகிறது…';
hi.loading = hi.loading || 'लोड हो रहा है…';
en.more = en.more || 'More';
ta.more = ta.more || 'மேலும்';
hi.more = hi.more || 'और';
en.edit = en.edit || 'Edit';
ta.edit = ta.edit || 'திருத்து';
hi.edit = hi.edit || 'संपादित करें';
en.submit = en.submit || 'Submit';
ta.submit = ta.submit || 'சமர்ப்பி';
hi.submit = hi.submit || 'जमा करें';
en.back = en.back || 'Back';
ta.back = ta.back || 'பின்';
hi.back = hi.back || 'वापस';
en.filter = en.filter || 'Filter';
ta.filter = ta.filter || 'வடிகட்டி';
hi.filter = hi.filter || 'फ़िल्टर';
en.yes = en.yes || 'Yes';
ta.yes = ta.yes || 'ஆம்';
hi.yes = hi.yes || 'हाँ';
en.no = en.no || 'No';
ta.no = ta.no || 'இல்லை';
hi.no = hi.no || 'नहीं';
en.card = en.card || 'Card';
ta.card = ta.card || 'கார்டு';
hi.card = hi.card || 'कार्ड';
en.cheque = en.cheque || 'Cheque';
ta.cheque = ta.cheque || 'செக்';
hi.cheque = hi.cheque || 'चेक';
en.gift = en.gift || 'Gift';
ta.gift = ta.gift || 'பரிசு';
hi.gift = hi.gift || 'उपहार';
en.upi = en.upi || 'UPI';
ta.upi = ta.upi || 'UPI';
hi.upi = hi.upi || 'UPI';
en.evtVenue = en.evtVenue || 'Venue';
ta.evtVenue = ta.evtVenue || 'இடம்';
hi.evtVenue = hi.evtVenue || 'स्थान';

const allKeys = new Set([
  ...Object.keys(en),
  ...Object.keys(ta),
  ...Object.keys(hi),
  ...Object.keys(webExtra),
  ...Object.keys(aliasMap),
]);

function resolve(lang, key) {
  if (aliasMap[key]) {
    const src = aliasMap[key];
    const maps = { en, ta, hi };
    return maps[lang][src] ?? en[src] ?? key;
  }
  if (webExtra[key]) {
    return webExtra[key][lang];
  }
  const maps = { en, ta, hi };
  return maps[lang][key] ?? en[key] ?? key;
}

function esc(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

let out = `// Generated by scripts/sync-web-i18n.mjs — do not edit by hand.\n\n`;
out += `export type TranslationKey = string;\n\n`;

for (const lang of ['en', 'ta', 'hi']) {
  out += `export const ${lang}: Record<string, string> = {\n`;
  for (const key of [...allKeys].sort()) {
    out += `  ${key}: ${esc(resolve(lang, key))},\n`;
  }
  out += `};\n\n`;
}

out += `export const translationsByLang = { en, ta, hi } as const;\n`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${allKeys.size} keys)`);

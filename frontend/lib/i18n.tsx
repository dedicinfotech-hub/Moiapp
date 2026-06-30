'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ta';

interface Translations {
  [key: string]: {
    en: string;
    ta: string;
  };
}

// Core translations - can be expanded
const translations: Translations = {
  // Common
  app_name: { en: 'Moi App', ta: 'மோய் ஆப்' },
  loading: { en: 'Loading…', ta: 'ஏற்றுகிறது…' },
  save: { en: 'Save', ta: 'சேமிக்கவும்' },
  cancel: { en: 'Cancel', ta: 'ரதி செய்யவும்' },
  delete: { en: 'Delete', ta: 'நீக்கவும்' },
  edit: { en: 'Edit', ta: 'திருத்தவும்' },
  submit: { en: 'Submit', ta: 'சமர்ப்பிக்கவும்' },
  back: { en: 'Back', ta: 'முன்னால்' },
  next: { en: 'Next', ta: 'அடுத்து' },
  continue: { en: 'Continue', ta: 'தொடரவும்' },
  search: { en: 'Search', ta: 'தேடு' },
  filter: { en: 'Filter', ta: 'வடிகட்டி' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  yes: { en: 'Yes', ta: 'ஆம்' },
  no: { en: 'No', ta: 'இல்லை' },
  
  // Auth
  login: { en: 'Login', ta: 'உள்நுழைய' },
  logout: { en: 'Logout', ta: 'வெளியேறு' },
  signup: { en: 'Sign Up', ta: 'பதிவு செய்யவும்' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  password: { en: 'Password', ta: 'கடவுச்சொல்' },
  otp: { en: 'OTP', ta: 'OTP' },
  send_otp: { en: 'Send OTP', ta: 'OTP அனுப்பு' },
  verify_otp: { en: 'Verify OTP', ta: 'OTP சரிபார்க்கவும்' },
  enter_otp: { en: 'Enter OTP', ta: 'OTP உள்ளிடவும்' },
  resend_otp: { en: 'Resend OTP', ta: 'OTP மீண்டும் அனுப்பு' },
  
  menu: { en: 'Menu', ta: 'மெனு' },
  section_admin: { en: 'Admin', ta: 'நிர்வாகம்' },
  home: { en: 'Home', ta: 'முகப்பு' },
  functions: { en: 'Functions', ta: 'செயல்பாடுகள்' },
  moi_list: { en: 'Moi List', ta: 'மோய் பட்டியல்' },
  reports: { en: 'Reports', ta: 'அறிக்கைகள்' },
  more: { en: 'More', ta: 'மேலும்' },
  create_function: { en: 'Create New Function', ta: 'புதிய செயல்பாட்டை உருவாக்கு' },
  total_functions: { en: 'Total Functions', ta: 'மொத்த செயல்பாடுகள்' },
  total_moi: { en: 'Total Moi Collected', ta: 'மொத்த மோய் சேகரிக்கப்பட்டது' },
  pending_returns: { en: 'Pending Returns', ta: 'நிலுவையில் திரும்பவும்' },
  total_contributors: { en: 'Total Contributors', ta: 'மொத்த பங்களிப்பாளர்கள்' },
  guest_payments: { en: 'Guest Payments', ta: 'விருந்தினர் பணம்' },
  
  // Event
  event_type: { en: 'Event Type', ta: 'நிகழ்வு வகை' },
  wedding: { en: 'Wedding', ta: 'திருமணம்' },
  birthday: { en: 'Birthday', ta: 'பிறந்தநாள்' },
  engagement: { en: 'Engagement', ta: 'நிச்சயதாரணம்' },
  housewarming: { en: 'Housewarming', ta: 'வீட்டு தேவி விழா' },
  graduation: { en: 'Graduation', ta: 'பட்டம் விழா' },
  custom: { en: 'Custom', ta: 'தனிப்பயன்' },
  new_event: { en: 'New Event', ta: 'புதிய நிகழ்வு' },
  past_event: { en: 'Past Event', ta: 'முந்தைய நிகழ்வு' },
  date: { en: 'Date', ta: 'தேதி' },
  venue: { en: 'Venue', ta: 'இடம்' },
  city: { en: 'City', ta: 'நகரம்' },
  
  // Moi Entry
  moi_entry: { en: 'Moi Entry', ta: 'மோய் பதிவு' },
  add_entry: { en: 'Add Entry', ta: 'பதிவு சேர்க்கவும்' },
  guest_name: { en: 'Guest Name', ta: 'விருந்தினர் பெயர்' },
  amount: { en: 'Amount', ta: 'தொகை' },
  payment_method: { en: 'Payment Method', ta: 'பணம் செலுத்தும் முறை' },
  cash: { en: 'Cash', ta: 'நிதி' },
  upi: { en: 'UPI', ta: 'UPI' },
  card: { en: 'Card', ta: 'கார்டு' },
  cheque: { en: 'Cheque', ta: 'செக்' },
  gold: { en: 'Gold', ta: 'தங்கம்' },
  silver: { en: 'Silver', ta: 'வெள்ளி' },
  gift: { en: 'Gift', ta: 'பரிசு' },
  other: { en: 'Other', ta: 'மற்றவை' },
  
  // Reports
  export_pdf: { en: 'Export PDF', ta: 'PDF ஏற்றுமதி' },
  export_excel: { en: 'Export Excel', ta: 'எக்ஸெல் ஏற்றுமதி' },
  total_collection: { en: 'Total Collection', ta: 'மொத்த சேகரிப்பு' },
  average: { en: 'Average', ta: 'சராசரி' },
  
  // Settings
  settings: { en: 'Settings', ta: 'அமைப்புகள்' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்' },
  language: { en: 'Language', ta: 'மொழி' },
  font_size: { en: 'Font Size', ta: 'எழுத்து அளவு' },
  delete_account: { en: 'Delete Account', ta: 'கணக்கை நீக்கு' },
  
  // Misc
  welcome: { en: 'Welcome', ta: 'வணக்கம்' },
  get_started: { en: 'Get Started', ta: 'தொடங்குங்கள்' },
  already_have_account: { en: 'Already have an account?', ta: 'ஏற்கனவே கணக்கு உள்ளதா?' },
  your_data_is_safe: { en: 'Your data is safe with us', ta: 'உங்கள் தரவு எங்களிடம் பாதுகாப்பாக உள்ளது' },

  // Admin modules
  admin_dashboard: { en: 'Admin Dashboard', ta: 'நிர்வாக முகப்பு' },
  admin_approvals: { en: 'Approvals', ta: 'அனுமதிகள்' },
  admin_users: { en: 'User Management', ta: 'பயனர் நிர்வாகம்' },
  admin_analytics: { en: 'Analytics', ta: 'பகுப்பாய்வு' },
  admin_revenue: { en: 'Revenue', ta: 'வருவாய்' },
  admin_support: { en: 'Support', ta: 'ஆதரவு' },
  admin_private_events: { en: 'Private Events', ta: 'தனிப்பட்ட நிகழ்வுகள்' },
  admin_login_logs: { en: 'Login Logs', ta: 'உள்நுழைவு பதிவுகள்' },
  mod_dashboard_sub: { en: 'Overview of your Moi activity', ta: 'உங்கள் மொய் சுருக்கம்' },
  mod_events_sub: { en: 'Manage all wedding events', ta: 'அனைத்து நிகழ்வுகளையும் நிர்வகிக்கவும்' },
  mod_organizers_sub: { en: 'Manage event organizers', ta: 'நிகழ்வு ஒருங்கிணைப்பாளர்களை நிர்வகிக்கவும்' },
  mod_moi_notebook_sub: { en: 'Track all moi entries', ta: 'அனைத்து மொய் பதிவுகளையும் கண்காணிக்கவும்' },
  mod_users_sub: { en: 'Guest & user management', ta: 'விருந்தினர் மற்றும் பயனர் நிர்வாகம்' },
  mod_analytics_sub: { en: 'Performance & insights', ta: 'செயல்திறன் மற்றும் நுண்ணறிவு' },
  mod_features_sub: { en: 'Enable or disable app features', ta: 'அம்சங்களை இயக்கு அல்லது முடக்கு' },
  mod_settings_sub: { en: 'Account & preferences', ta: 'கணக்கு மற்றும் விருப்பங்கள்' },
  mod_admin_dashboard_sub: { en: 'Admin overview and statistics', ta: 'நிர்வாக சுருக்கம்' },
  mod_admin_users_sub: { en: 'Manage all users', ta: 'அனைத்து பயனர்களையும் நிர்வகிக்கவும்' },
  mod_admin_analytics_sub: { en: 'Platform analytics and insights', ta: 'தள பகுப்பாய்வு' },
  mod_admin_revenue_sub: { en: 'Revenue management', ta: 'வருவாய் நிர்வாகம்' },
  mod_admin_support_sub: { en: 'Support tickets and complaints', ta: 'ஆதரவு டிக்கெட்டுகள்' },
  mod_admin_approvals_sub: { en: 'Approve or reject new events', ta: 'புதிய நிகழ்வுகளை அனுமதி அல்லது நிராகரி' },
  mod_admin_private_events_sub: { en: 'Manage private events', ta: 'தனிப்பட்ட நிகழ்வுகளை நிர்வகிக்கவும்' },
  mod_admin_login_logs_sub: { en: 'Authentication audit trail', ta: 'அங்கீகார தணிக்கை பதிவு' },
  moi_notebook: { en: 'Moi Notebook', ta: 'மொய் நோட்புக்' },
  organizers: { en: 'Organizers', ta: 'ஒருங்கிணைப்பாளர்கள்' },
  guests: { en: 'Guests', ta: 'விருந்தினர்கள்' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('moi_settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        if (settings.language === 'ta' || settings.language === 'en') {
          setLanguageState(settings.language);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
    settings.language = lang;
    localStorage.setItem('moi_settings', JSON.stringify(settings));
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation['en'] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'en' as Language, setLanguage: () => {}, t: (key: string) => key };
  }
  return context;
}

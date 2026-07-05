'use client';

import { useTranslation, LANGUAGE_OPTIONS, type ActiveLanguage } from '@/lib/i18n';
import { useFeatures } from '@/lib/features';
import { FEATURE_LANGUAGE_CONVERSION } from '@/lib/featureKeys';

interface LanguageSelectorProps {
  className?: string;
  /** `select` for settings; `buttons` for onboarding-style pickers */
  variant?: 'select' | 'buttons';
}

export default function LanguageSelector({
  className = '',
  variant = 'select',
}: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();
  const { isEnabled, loading } = useFeatures();

  if (loading || !isEnabled(FEATURE_LANGUAGE_CONVERSION)) {
    return null;
  }

  const handleChange = (code: ActiveLanguage) => {
    setLanguage(code);
  };

  if (variant === 'buttons') {
    return (
      <div className={className}>
        <p className="block text-sm font-semibold text-tn-muted mb-2">
          {t('language')} / மொழி / भाषा
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.filter((opt) => opt.available).map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => handleChange(opt.code)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                language === opt.code
                  ? 'border-tn-yellow bg-tn-yellow-bg text-tn-text'
                  : 'border-tn-border bg-white text-tn-muted hover:border-tn-yellow'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-tn-text">{t('language')}</p>
        <p className="text-xs text-tn-muted">English · Tamil · Hindi</p>
      </div>
      <select
        value={language}
        onChange={(e) => handleChange(e.target.value as ActiveLanguage)}
        className="shrink-0 border border-tn-border rounded-lg px-3 py-1.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow max-w-[52%]"
        aria-label={t('language')}
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code} disabled={!opt.available}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

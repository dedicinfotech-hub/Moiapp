'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

/** Sync document lang with selected app language. */
export default function HtmlLang() {
  const { language } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}

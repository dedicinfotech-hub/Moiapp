'use client';

import { useTranslation } from '@/lib/i18n';
import { useSlug } from '@/lib/useSlug';
import { useGuestTokenPublicRedirect } from '@/lib/useGuestTokenPublicRedirect';

export default function GuestQRCodeLandingScreen() {
  const { t } = useTranslation();
  const token = useSlug(1);
  const state = useGuestTokenPublicRedirect(token);

  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-tn-muted">
        {t('eventNotFoundOrExpired')}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
    </div>
  );
}

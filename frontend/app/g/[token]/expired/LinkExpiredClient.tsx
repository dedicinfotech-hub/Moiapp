'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api';
import Icon from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';
import { useTranslation } from '@/lib/i18n';

export default function LinkExpiredScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const token = useSlug(1);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" /></div>;
  }

  const title = event?.custom_title || (event?.bride_name && event?.groom_name ? `${event.bride_name} & ${event.groom_name}` : event?.event_type);
  const dateStr = event?.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }) : '—';

  return (
    <div className="min-h-screen bg-tn-light px-4 py-10">
      <div className="max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-tn-red-bg rounded-full flex items-center justify-center mx-auto mb-5 relative">
          <Icon name="download" size={32} className="text-tn-error" />
        </div>
        <h1 className="text-2xl font-bold text-tn-text mb-2">{t('linkExpired')}</h1>
        <p className="text-sm text-tn-muted mb-6">{t('linkExpiredSub')}</p>

        <div className="bg-tn-red-bg border border-tn-border rounded-2xl p-4 mb-5 text-left flex gap-3">
          <div className="w-8 h-8 rounded-full bg-tn-error text-white flex items-center justify-center text-sm font-bold shrink-0">i</div>
          <div>
            <p className="text-sm font-bold text-tn-text">{t('linkExpiredWhy')}</p>
            <p className="text-xs text-tn-muted mt-1">{t('linkExpiredWhySub')}</p>
          </div>
        </div>

        {event && (
          <div className="bg-white border border-tn-border rounded-2xl p-4 mb-6 text-left shadow-sm">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 bg-tn-yellow/10 rounded-xl flex items-center justify-center text-tn-yellow">
                <Icon name="gift" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-tn-text">{title}</p>
                <p className="text-[11px] text-tn-muted mt-1 inline-flex items-center gap-1"><Icon name="calendar" size={12} /> {dateStr}</p>
                <p className="text-[11px] text-tn-muted inline-flex items-center gap-1"><Icon name="map" size={12} /> {event.venue || event.city || '—'}</p>
              </div>
            </div>
            <div className="border-t border-tn-border pt-3">
              <p className="text-xs font-bold text-tn-text">{t('guestHelpFooter')}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button type="button" onClick={() => alert(t('requestLinkMessage'))} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <Icon name="list" size={16} /> {t('requestNewLink')}
          </button>
          <button type="button" onClick={() => router.push('/')} className="w-full h-12 border-2 border-tn-yellow text-tn-yellow rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <Icon name="venue" size={16} /> {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
}

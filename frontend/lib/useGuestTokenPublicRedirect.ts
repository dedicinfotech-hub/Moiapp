'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';

/** Redirect legacy /g/:token entry URLs to the public event page (/e/:slug). */
export function useGuestTokenPublicRedirect(token: string): 'loading' | 'not_found' {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'not_found'>('loading');

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token)
      .then((ev) => {
        if (ev.slug) {
          router.replace(`/e/${ev.slug}`);
          return;
        }
        setState('not_found');
      })
      .catch(() => setState('not_found'));
  }, [token, router]);

  return state;
}

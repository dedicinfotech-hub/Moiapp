'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useGuestTokenPublicRedirect } from '@/lib/useGuestTokenPublicRedirect';

function useToken(): string {
  const [token, setToken] = useState('');
  useEffect(() => {
    let path = window.location.pathname.split('?')[0].split('#')[0];
    path = path.replace(/\/(index\.html?)$/i, '').replace(/\/$/, '');
    const parts = path.split('/');
    const t = parts[parts.length - 1];
    setToken(t === '_' ? '' : t);
  }, []);
  return token;
}

export default function GuestPaymentClient() {
  const token = useToken();
  const state = useGuestTokenPublicRedirect(token);

  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tn-light px-6 text-center">
        <div>
          <Icon name="lock" size={48} className="mb-3 text-tn-yellow mx-auto" />
          <h1 className="text-lg font-bold text-tn-text">This event is no longer accepting moi</h1>
          <p className="text-sm text-tn-muted mt-2">Please contact the host.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tn-light">
      <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
    </div>
  );
}

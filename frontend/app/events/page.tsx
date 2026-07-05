'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { buildLoginUrl } from '@/lib/authNavigation';

export default function EventsListingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const target = '/dashboard?module=events';
    router.replace(user ? target : buildLoginUrl(target));
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-tn-light flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
    </div>
  );
}

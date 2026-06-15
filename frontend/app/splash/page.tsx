'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import MoiLogo from '@/components/ui/MoiLogo';
import { MandalaBackground, FamilyIllustration } from '@/components/ui/OnboardingDecor';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#4B218B] flex items-center justify-center">
        <MoiLogo size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5B21B6] via-[#4B218B] to-[#3B1570] flex flex-col relative overflow-hidden">
      <MandalaBackground />

      <div className="flex-1 flex flex-col items-center px-6 pt-16 pb-8 relative z-10">
        {/* Logo */}
        <MoiLogo size="lg" className="mb-3" />

        {/* Divider with hearts */}
        <div className="flex items-center gap-3 my-4 w-full max-w-[200px]">
          <div className="flex-1 h-px bg-white/30" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity="0.8">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <div className="flex-1 h-px bg-white/30" />
        </div>

        {/* Tagline */}
        <p className="text-base text-white/95 font-medium text-center mb-1">உங்கள் உறவுகளை இணைக்கும் மொய்</p>
        <p className="text-sm text-white/70 text-center mb-8">Connecting Relationships Through Moi</p>

        {/* Family Illustration */}
        <FamilyIllustration />

        {/* Feature bar */}
        <div className="w-full max-w-sm mt-6 mb-8 bg-[#3B1570]/60 backdrop-blur-sm rounded-2xl px-4 py-4 border border-white/10">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="text-[10px] font-semibold text-white leading-tight">Record Moi<br />With Love</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <p className="text-[10px] font-semibold text-white leading-tight">Secure &<br />Private</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <p className="text-[10px] font-semibold text-white leading-tight">Track & Manage<br />With Ease</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-10 relative z-10 w-full max-w-sm mx-auto space-y-3">
        <Link
          href="/login"
          className="block w-full h-14 bg-white text-[#4B218B] rounded-2xl font-bold text-base hover:bg-gray-50 transition-all active:scale-[0.98] shadow-lg text-center leading-[56px]"
        >
          Get Started
        </Link>
        <p className="text-center text-sm text-white/80">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#FFC107]">Login</Link>
        </p>
      </div>
    </div>
  );
}

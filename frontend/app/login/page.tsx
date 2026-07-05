'use client';

import { useState, type FormEvent, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BrandWordmark from '@/components/ui/BrandWordmark';
import { postLoginPath, sanitizeReturnTo } from '@/lib/authNavigation';
import { getRememberedEmail, rememberEmail } from '@/lib/sessionAuth';
import { useTranslation } from '@/lib/i18n';

type LoginMode = 'email' | 'phone';
type OtpStep = 'phone' | 'otp';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('phone');

  const returnTo = searchParams.get('returnTo');
  const backTarget = sanitizeReturnTo(returnTo) ?? '/';
  const afterLoginTarget = postLoginPath(returnTo);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) router.replace(afterLoginTarget);
  }, [user, authLoading, router, afterLoginTarget]);

  // Browser back from login should return to the previous in-app page, not exit
  useEffect(() => {
    const handlePopState = () => {
      router.replace(backTarget);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router, backTarget]);

  // ── Email form ────────────────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });
  const [adminOtp, setAdminOtp] = useState('');
  const [needsAdminOtp, setNeedsAdminOtp] = useState(false);
  const [adminOtpEmail, setAdminOtpEmail] = useState('');
  const [adminOtpNotice, setAdminOtpNotice] = useState('');

  // ── Phone / OTP form ──────────────────────────────────────────────────────
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [otpStep, setOtpStep]     = useState<OtpStep>('phone');
  const [otpTimer, setOtpTimer]   = useState(0);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = "w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors";

  // Start resend countdown
  const startTimer = () => {
    setOtpTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    const saved = getRememberedEmail();
    if (saved) setEmailForm((f) => ({ ...f, email: saved }));
  }, []);

  const handleResendAdminOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({
        email: emailForm.email,
        password: emailForm.password,
      });
      if (res.requires_otp) {
        setAdminOtpEmail(res.otp_email || emailForm.email);
        setAdminOtpNotice(res.message || 'OTP resent. Check inbox and spam folder.');
        setAdminOtp('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Email login ───────────────────────────────────────────────────────────
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({
        email: emailForm.email,
        password: emailForm.password,
        otp: needsAdminOtp ? adminOtp : undefined,
      });
      if (res.requires_otp) {
        setNeedsAdminOtp(true);
        setAdminOtp('');
        setAdminOtpEmail(res.otp_email || emailForm.email);
        setAdminOtpNotice(res.message || 'OTP sent to your admin email. Check inbox and spam folder.');
        return;
      }
      if (!res.token || !res.user) {
        setError('Login failed');
        return;
      }
      rememberEmail(emailForm.email);
      login(res.token, res.user);
      router.push(afterLoginTarget);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOTP(phone);
      setOtp('');
      setOtpStep('otp');
      startTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (otpTimer > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await authApi.sendOTP(phone);
      setOtp('');
      startTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{4,6}$/.test(otp)) {
      setError('Enter the OTP sent to your phone');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(phone, otp);
      login(res.token, res.user);
      router.push(res.needsProfile ? '/profile-setup' : afterLoginTarget);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* <button
        type="button"
        onClick={() => router.push(backTarget)}
        className="absolute top-4 left-4 z-20 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 border border-tn-border text-tn-text hover:bg-white transition-colors"
        aria-label="Go back"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button> */}
      {/* Decorative background rings */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-tn-yellow/8 blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-tn-yellow/45 rounded-2xl shadow-[0_0_12px_rgba(255,193,7,0.15)] p-8 transition-all duration-300 hover:shadow-[0_0_18px_rgba(255,193,7,0.25)]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandWordmark size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-tn-text">{t('welcomeBack')}</h1>
            <p className="text-tn-muted text-sm mt-1">{t('signInSubtitle')}</p>
          </div>
          {/* Login Mode Toggle */}
          <div className="flex border-b-2 border-tn-border mb-6">
            <button type="button" onClick={() => { setMode('phone'); setError(''); setOtpStep('phone'); }}
              className={`flex-1 pb-3 text-center font-bold text-sm border-b-[3px] transition-all duration-200 focus:outline-none ${mode === 'phone' ? 'border-tn-yellow text-tn-text' : 'border-transparent text-tn-muted hover:text-tn-text'}`}>
              {t('phoneLogin')}
            </button>
            <button type="button" onClick={() => { setMode('email'); setError(''); }}
              className={`flex-1 pb-3 text-center font-bold text-sm border-b-[3px] transition-all duration-200 focus:outline-none ${mode === 'email' ? 'border-tn-yellow text-tn-text' : 'border-transparent text-tn-muted hover:text-tn-text'}`}>
              {t('emailLogin')}
            </button>
          </div>
          {error && (
            <div className="bg-tn-error-bg border border-tn-error/20 text-tn-error rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* ── Email Login ─────────────────────────────────────────────── */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('email')}</label>
                <input type="email" required value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className={inputCls} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('password')}</label>
                <input type="password" required value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className={inputCls} placeholder="••••••••" />
              </div>
              {needsAdminOtp ? (
                <div>
                  {adminOtpNotice ? (
                    <div className="bg-tn-blue-bg border border-tn-blue-soft/30 text-tn-text rounded-xl px-4 py-3 text-sm mb-4">
                      <p>{adminOtpNotice}</p>
                      {adminOtpEmail ? (
                        <p className="text-tn-muted mt-1">Sent to <span className="font-semibold">{adminOtpEmail}</span></p>
                      ) : null}
                    </div>
                  ) : null}
                  <label className="block text-sm font-semibold text-tn-muted mb-1.5">Admin OTP (sent to your email)</label>
                  <input type="text" required value={adminOtp} maxLength={6}
                    onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={inputCls} placeholder="6-digit code" />
                  <div className="text-right mt-2">
                    <button type="button" onClick={handleResendAdminOtp} disabled={loading}
                      className="text-sm text-tn-gold font-semibold hover:underline disabled:opacity-50">
                      Resend OTP
                    </button>
                  </div>
                </div>
              ) : null}
              <button type="submit" disabled={loading}
                className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 mt-2">
                {loading ? t('loading') : needsAdminOtp ? t('verifyAndSignIn') : t('signIn')}
              </button>
              <div className="text-right mt-2">
                <Link href="/forgot-password" className="text-sm text-tn-gold font-semibold hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
            </form>
          )}

          {/* ── Phone / OTP Login ──────────────────────────────────────── */}
          {mode === 'phone' && (
            <>
              {/* Step 1 — Enter phone */}
              {otpStep === 'phone' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('lblMobile')}</label>
                    <input type="tel" required value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={inputCls} placeholder="9876543210" maxLength={10}
                      inputMode="numeric" autoComplete="tel" />
                  </div>
                  <button type="submit" disabled={loading || phone.length !== 10}
                    className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50">
                    {loading ? t('loading') : t('sendOtp')}
                  </button>
                </form>
              )}

              {/* Step 2 — Enter OTP */}
              {otpStep === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  {/* Phone number display with change option */}
                  <div className="flex items-center justify-between bg-tn-light rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] text-tn-subtle font-semibold uppercase tracking-wide">OTP sent to</p>
                      <p className="text-sm font-bold text-tn-text">+91 {phone}</p>
                    </div>
                    <button type="button" onClick={() => { setOtpStep('phone'); setOtp(''); setError(''); }}
                      className="text-xs text-tn-gold font-semibold hover:underline">
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('verifyOtp')}</label>
                    <input type="text" required value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em]`}
                      placeholder="· · · · · ·" maxLength={6}
                      inputMode="numeric" autoComplete="one-time-code" autoFocus />
                  </div>

                  <button type="submit" disabled={loading || otp.length < 4}
                    className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50">
                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <p className="text-sm text-tn-muted">Resend OTP in <span className="font-bold text-tn-gold">{otpTimer}s</span></p>
                    ) : (
                      <button type="button" onClick={handleResendOTP} disabled={loading}
                        className="text-sm text-tn-gold font-semibold hover:underline disabled:opacity-50">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}

          <p className="text-center text-sm text-tn-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-tn-gold font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

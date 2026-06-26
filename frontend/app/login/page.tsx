'use client';

import { useState, type FormEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MoiLogo from '@/components/ui/MoiLogo';

type LoginMode = 'email' | 'phone';
type OtpStep = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [mode, setMode] = useState<LoginMode>('phone');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) router.push('/dashboard');
  }, [user, authLoading, router]);

  // ── Email form ────────────────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });

  // ── Phone / OTP form ──────────────────────────────────────────────────────
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [otpStep, setOtpStep]     = useState<OtpStep>('phone');
  const [otpTimer, setOtpTimer]   = useState(0);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";

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

  // ── Email login ───────────────────────────────────────────────────────────
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(emailForm);
      login(res.token, res.user);
      router.push('/dashboard');
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
      router.push(res.needsProfile ? '/profile-setup' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <MoiLogo variant="dark" size="md" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your MoiApp account</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button type="button" onClick={() => { setMode('phone'); setError(''); setOtpStep('phone'); }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === 'phone' ? 'bg-[#FFC107] text-gray-900' : 'text-gray-600'}`}>
              Phone
            </button>
            <button type="button" onClick={() => { setMode('email'); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === 'email' ? 'bg-[#FFC107] text-gray-900' : 'text-gray-600'}`}>
              Email
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* ── Email Login ─────────────────────────────────────────────── */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                <input type="email" required value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className={inputCls} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                <input type="password" required value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className={inputCls} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div className="text-right mt-2">
                <Link href="/forgot-password" className="text-sm text-[#B8860B] font-semibold hover:underline">
                  Forgot Password?
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
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mobile Number</label>
                    <input type="tel" required value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={inputCls} placeholder="9876543210" maxLength={10}
                      inputMode="numeric" autoComplete="tel" />
                  </div>
                  <button type="submit" disabled={loading || phone.length !== 10}
                    className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
                    {loading ? 'Sending OTP…' : 'Send OTP'}
                  </button>
                </form>
              )}

              {/* Step 2 — Enter OTP */}
              {otpStep === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  {/* Phone number display with change option */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">OTP sent to</p>
                      <p className="text-sm font-bold text-gray-800">+91 {phone}</p>
                    </div>
                    <button type="button" onClick={() => { setOtpStep('phone'); setOtp(''); setError(''); }}
                      className="text-xs text-[#B8860B] font-semibold hover:underline">
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Enter OTP</label>
                    <input type="text" required value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em]`}
                      placeholder="· · · · · ·" maxLength={6}
                      inputMode="numeric" autoComplete="one-time-code" autoFocus />
                  </div>

                  <button type="submit" disabled={loading || otp.length < 4}
                    className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <p className="text-sm text-gray-400">Resend OTP in <span className="font-bold text-[#B8860B]">{otpTimer}s</span></p>
                    ) : (
                      <button type="button" onClick={handleResendOTP} disabled={loading}
                        className="text-sm text-[#B8860B] font-semibold hover:underline disabled:opacity-50">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#B8860B] font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { OtpPhoneIllustration } from '@/components/ui/OnboardingDecor';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(300);
  const [resendTimer, setResendTimer] = useState(28);
  const [canResend, setCanResend] = useState(false);
  const [phone, setPhone] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('otp_phone');
    if (!storedPhone) {
      router.push('/login');
      return;
    }
    setPhone(storedPhone);

    const expiryInterval = setInterval(() => {
      setOtpExpiry((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    const resendInterval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(expiryInterval);
      clearInterval(resendInterval);
    };
  }, [router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && value && newOtp.every((d) => d !== '')) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pastedData[i] || '';
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    if (pastedData.length === 6) handleVerify(pastedData);
  };

  const handleVerify = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOTP(phone, code);
      login(res.token, res.user);
      router.push(res.needsProfile ? '/profile-setup' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(28);
    setError('');
    try {
      await authApi.sendOTP(phone);
      setOtpExpiry(300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
      setCanResend(true);
    }
  };

  const displayPhone = phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '';

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Back button */}
      <div className="px-4 pt-4">
        <Link href="/login" className="inline-flex items-center justify-center w-10 h-10 text-tn-purple" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-8 max-w-sm mx-auto w-full">
        <OtpPhoneIllustration />

        <div className="text-center mb-8">
          <h1 className="text-[26px] font-bold text-tn-text mb-2">Enter OTP</h1>
          <p className="text-sm text-tn-muted">We have sent a 6 digit OTP to</p>
          <p className="text-sm font-bold text-tn-purple mt-1">{displayPhone}</p>
        </div>

        {error && (
          <div className="bg-tn-error border-tn-error text-tn-error rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
        )}

        <div className="flex justify-between gap-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors ${
                digit ? 'border-tn-purple' : index === otp.findIndex((d) => !d) ? 'border-tn-purple' : 'border-tn-border'
              }`}
            />
          ))}
        </div>

        <div className="text-center mb-5">
          {!canResend ? (
            <p className="text-sm text-tn-muted">
            Resend OTP in <span className="font-semibold text-tn-purple">{formatTime(resendTimer)}</span>
          </p>
        ) : (
          <button type="button" onClick={handleResend} className="text-sm text-tn-purple font-semibold hover:underline">Resend OTP</button>
        )}
        </div>

        <div className="bg-tn-purple-bg rounded-xl px-4 py-3.5 text-sm text-tn-purple mb-6 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p>For your security, never share your OTP with anyone.</p>
        </div>

        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={loading || otp.some((d) => d === '')}
          className="w-full h-[52px] bg-tn-purple text-white rounded-xl font-semibold text-base hover:bg-tn-purple-2 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Verifying…' : 'Verify OTP'}
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-tn-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>OTP will expire in <strong className="text-tn-text">{formatTime(otpExpiry)}</strong></span>
        </div>

        <p className="text-center text-sm text-tn-muted mt-6">
          Didn&apos;t receive OTP?{' '}
          {canResend ? (
            <button type="button" onClick={handleResend} className="text-tn-purple font-semibold hover:underline">Resend OTP</button>
          ) : (
            <span className="text-tn-purple font-semibold">Resend OTP</span>
          )}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MoiLogo from '@/components/ui/MoiLogo';

type LoginMode = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [mode, setMode] = useState<LoginMode>('phone');

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('moiapp/dashboard');
    }
  }, [user, authLoading, router]);
  
  // Email login form
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });
  
  // Phone login form
  const [phoneForm, setPhoneForm] = useState({ phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";
  
  // Handle email login
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

  // Handle send OTP
  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate 10-digit phone number
    if (!/^[0-9]{10}$/.test(phoneForm.phone)) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }
    
    try {
      await authApi.sendOTP(phoneForm.phone);
      setOtpSent(true);
      setOtpTimer(30);
      
      // Start countdown
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await authApi.verifyOTP(phoneForm.phone, phoneForm.otp);
      login(res.token, res.user);
      
      // If new user, redirect to profile setup
      if (res.needsProfile) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
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
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                mode === 'phone' ? 'bg-[#FFC107] text-gray-900' : 'text-gray-600'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                mode === 'email' ? 'bg-[#FFC107] text-gray-900' : 'text-gray-600'
              }`}
            >
              Email
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {/* Email Login Form */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div className="text-right mt-2">
                <Link href="/forgot-password" className="text-sm text-[#B8860B] font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </form>
          )}

          {/* Phone Login Form */}
          {mode === 'phone' && (
            <div className="space-y-4">
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={phoneForm.phone} 
                    onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })} 
                    className={inputCls} 
                    placeholder="9876543210" 
                    maxLength={10}
                    disabled={otpSent}
                  />
                </div>
                
                {!otpSent ? (
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Sending…' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">OTP Code</label>
                      <input 
                        type="text" 
                        required 
                        value={phoneForm.otp} 
                        onChange={(e) => setPhoneForm({ ...phoneForm, otp: e.target.value })} 
                        className={inputCls} 
                        placeholder="Enter 6-digit OTP" 
                        maxLength={6}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleVerifyOTP}
                      disabled={loading} 
                      className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Verifying…' : 'Verify OTP'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)}
                      disabled={loading || otpTimer > 0}
                      className="w-full text-sm text-gray-500 hover:underline disabled:opacity-50"
                    >
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP'}
                    </button>
                  </>
                )}
              </form>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#B8860B] font-semibold hover:underline">Register</Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-300 mt-4">Powered by <span className="text-[#FFC107]">MoiApp</span></p>
      </div>
    </div>
  );
}

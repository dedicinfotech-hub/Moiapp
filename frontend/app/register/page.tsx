'use client';

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { assetUrl } from '@/lib/assetUrl';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await authApi.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      login(res.token, res.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors";
  const labelCls = "block text-sm font-semibold text-tn-muted mb-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg relative overflow-hidden flex items-center justify-center px-4 py-8 sm:py-16">
      {/* Decorative background rings */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-tn-yellow/8 blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-tn-yellow/45 rounded-2xl shadow-[0_0_12px_rgba(255,193,7,0.15)] p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_0_18px_rgba(255,193,7,0.25)]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative w-[110px] h-[24px]">
                <Image
                  src={assetUrl('/logo.png')}
                  alt="MoiApp Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-tn-text">Create Account</h1>
            <p className="text-tn-muted text-sm mt-2">Start tracking your wedding moi</p>
          </div>

          {error && (
            <div className="bg-tn-error-bg border border-tn-error/20 text-tn-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className={labelCls}>Full Name</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ravi Kumar" /></div>
            <div><label className={labelCls}>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@example.com" /></div>
            <div><label className={labelCls}>Phone <span className="text-tn-subtle font-normal">(optional)</span></label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+91 98765 43210" /></div>
            <div><label className={labelCls}>Password</label><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Min. 6 characters" /></div>
            <div><label className={labelCls}>Confirm Password</label><input type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputCls} placeholder="••••••••" /></div>
            <button type="submit" disabled={loading} className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 mt-4">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-tn-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-tn-gold font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-xs text-tn-subtle mt-4">Powered by <span className="text-tn-yellow">MoiApp</span></p>
      </div>
    </div>
  );
}

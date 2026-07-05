'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import BrandWordmark from '@/components/ui/BrandWordmark';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputCls = 'w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg relative overflow-hidden flex items-center justify-center px-4 py-8">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-tn-yellow/8 blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-tn-yellow/45 rounded-2xl shadow-[0_0_12px_rgba(255,193,7,0.15)] p-8 transition-all duration-300 hover:shadow-[0_0_18px_rgba(255,193,7,0.25)]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandWordmark size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-tn-text">{t('forgotPassword').replace('?', '')}</h1>
            <p className="text-tn-muted text-sm mt-1">{t('forgotPasswordSub')}</p>
          </div>

          {error && (
            <div className="bg-tn-error-bg border border-tn-error/20 text-tn-error rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-tn-success-bg border border-tn-success/20 text-tn-success rounded-xl px-4 py-3 text-sm mb-5">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? t('loading') : t('sendResetLink')}
            </button>
          </form>

          <p className="text-center text-sm text-tn-muted mt-6">
            {t('rememberPassword')}{' '}
            <Link href="/login" className="text-tn-gold font-semibold hover:underline">{t('signIn')}</Link>
          </p>
        </div>
        <p className="text-center text-xs text-tn-subtle mt-4">Powered by <span className="text-tn-yellow">Moi PassBook</span></p>
      </div>
    </div>
  );
}

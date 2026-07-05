'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputCls = "w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors";

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.resetPassword(token!, password);
      setMessage(res.message);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-tn-yellow-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-tn-border rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">❌</div>
              <h1 className="text-2xl font-bold text-tn-text">{t('invalidResetLink')}</h1>
              <p className="text-tn-muted text-sm mt-1">{t('invalidResetLinkSub')}</p>
            </div>
            <p className="text-center text-sm text-tn-text-secondary mt-6">
              <Link href="/forgot-password" className="text-tn-gold font-semibold hover:underline">
                {t('requestNewResetLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tn-yellow-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-tn-border rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-tn-text">{t('resetPassword')}</h1>
            <p className="text-tn-muted text-sm mt-1">{t('resetPasswordSub')}</p>
          </div>

          {error && (
            <div className="bg-tn-red-bg border border-tn-red-bg rounded-xl px-4 py-3 text-sm mb-5 text-tn-error">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-tn-green-bg border border-tn-green-bg rounded-xl px-4 py-3 text-sm mb-5 text-tn-success">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('newPassword')}</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={inputCls} 
                placeholder="••••••••" 
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-tn-muted mb-1.5">{t('confirmPassword')}</label>
              <input 
                type="password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className={inputCls} 
                placeholder="••••••••" 
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? t('resetting') : t('resetPassword')}
            </button>
          </form>

          <p className="text-center text-sm text-tn-text-secondary mt-6">
            <Link href="/login" className="text-tn-gold font-semibold hover:underline">{t('backToSignIn')}</Link>
          </p>
        </div>
        <p className="text-center text-xs text-tn-text-secondary mt-4">Powered by <span className="text-tn-yellow">Moi PassBook</span></p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-tn-yellow-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-tn-border rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin mx-auto" />
              <p className="text-tn-muted text-sm mt-2">{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
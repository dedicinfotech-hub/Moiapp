'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";

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
      setError('Passwords do not match');
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
      <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">❌</div>
              <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
              <p className="text-gray-400 text-sm mt-1">The password reset link is invalid or has expired</p>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              <Link href="/forgot-password" className="text-[#B8860B] font-semibold hover:underline">
                Request a new reset link
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your new password</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl px-4 py-3 text-sm mb-5">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">New Password</label>
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
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirm Password</label>
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
              className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            <Link href="/login" className="text-[#B8860B] font-semibold hover:underline">Back to Sign In</Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-300 mt-4">Powered by <span className="text-[#FFC107]">MoiApp</span></p>
      </div>
    </div>
  );
}
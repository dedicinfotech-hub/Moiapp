'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
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
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">💍</div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-gray-400 text-sm mt-1">Enter your email to reset your password</p>
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
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
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
              className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-[#B8860B] font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-300 mt-4">Powered by <span className="text-[#FFC107]">MoiApp</span></p>
      </div>
    </div>
  );
}
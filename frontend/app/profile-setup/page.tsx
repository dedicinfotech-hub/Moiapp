'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user already has a name, redirect to dashboard
    if (user?.name) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await authApi.updateProfile({
        ...form,
        phone: user?.phone || '',
      });
      
      // Update user context
      if (user) {
        login(
          localStorage.getItem('token') || '',
          { ...user, ...res.user }
        );
      }
      
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👤</div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-400 text-sm mt-1">Please provide your details to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Full Name *</label>
              <input 
                type="text" 
                required 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className={inputCls} 
                placeholder="Enter your full name" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email (Optional)</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                className={inputCls} 
                placeholder="you@example.com" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">City</label>
              <input 
                type="text" 
                value={form.city} 
                onChange={(e) => setForm({ ...form, city: e.target.value })} 
                className={inputCls} 
                placeholder="Your city" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#FFC107] text-gray-900 py-3 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-300 mt-4">Powered by <span className="text-[#FFC107]">MoiApp</span></p>
      </div>
    </div>
  );
}
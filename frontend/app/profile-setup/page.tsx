'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MoiLogo from '@/components/ui/MoiLogo';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user already has a name, redirect to dashboard
    if (!authLoading && user?.name) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
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

  const inputCls = "w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors";

  return (
    <div className="min-h-screen bg-tn-yellow-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-tn-border rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <MoiLogo variant="dark" size="md" />
            </div>
            <h1 className="text-2xl font-bold text-tn-text">Complete Your Profile</h1>
            <p className="text-tn-muted text-sm mt-1">Please provide your details to continue</p>
          </div>

          {error && (
            <div className="bg-tn-red-bg border border-tn-red-bg text-tn-error rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-tn-muted mb-1.5">Full Name *</label>
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
              <label className="block text-sm font-semibold text-tn-muted mb-1.5">Email (Optional)</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                className={inputCls} 
                placeholder="you@example.com" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-tn-muted mb-1.5">City</label>
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
              className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-tn-subtle mt-4">Powered by <span className="text-tn-yellow">MoiApp</span></p>
      </div>
    </div>
  );
}
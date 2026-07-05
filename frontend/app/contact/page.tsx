'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { contactApi } from '@/lib/api';
import Icon from '@/components/ui/Icon';
import BrandWordmark from '@/components/ui/BrandWordmark';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const inputCls = "w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!form.name || !form.email || !form.phone || !form.message) {
      setError('All fields are required');
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Phone number must be a valid 10-digit number');
      return;
    }

    setLoading(true);
    try {
      const res = await contactApi.submitEnquiry(form);
      if (res.success) {
        setSuccess(true);
        toast.success(res.message || 'Enquiry submitted successfully!');
        setForm({ name: '', email: '', phone: '', message: '' });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg relative overflow-hidden flex items-center justify-center px-4 py-16">
      {/* Decorative background rings */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-tn-yellow/8 blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 my-8">
        <div className="bg-white border border-tn-yellow/45 rounded-2xl shadow-[0_0_12px_rgba(255,193,7,0.15)] p-8 transition-all duration-300 hover:shadow-[0_0_18px_rgba(255,193,7,0.25)]">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Link href="/">
                <BrandWordmark size="lg" className="cursor-pointer" />
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-tn-text">Contact Us</h1>
            <p className="text-tn-muted text-sm mt-1">Submit your enquiry and we will get back to you shortly</p>
          </div>

          {error && (
            <div className="bg-tn-error-bg border border-tn-error/20 text-tn-error rounded-xl px-4 py-3 text-sm mb-5 flex items-start gap-2">
              <Icon name="lock" className="text-tn-error mt-0.5 flex-shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-tn-success-bg text-tn-success rounded-full flex items-center justify-center mx-auto border border-tn-success/20 shadow-sm">
                <Icon name="check" size={32} />
              </div>
              <h2 className="text-xl font-bold text-tn-text">Thank You!</h2>
              <p className="text-sm text-tn-muted max-w-xs mx-auto leading-relaxed">
                Your enquiry has been received. Our team will review your details and respond to your email as soon as possible.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="bg-tn-yellow text-tn-text px-6 py-2.5 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors text-sm shadow-sm"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-tn-muted mb-1.5">Full Name</label>
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
                <label className="block text-sm font-semibold text-tn-muted mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-tn-muted mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className={inputCls}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-tn-muted mb-1.5">Enquiry Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputCls} min-h-[100px] resize-y`}
                  placeholder="Describe your query or request..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-tn-yellow text-tn-text py-3 rounded-xl font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? 'Submitting…' : 'Submit Enquiry'}
              </button>
            </form>
          )}

          <div className="text-center mt-6 pt-6 border-t border-tn-border">
            <Link href="/" className="text-sm text-tn-gold font-semibold hover:underline flex items-center justify-center gap-1.5">
              <Icon name="arrow-right" size={14} className="rotate-180" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

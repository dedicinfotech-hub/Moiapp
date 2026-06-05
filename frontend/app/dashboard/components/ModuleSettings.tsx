'use client';

import { useState } from 'react';
import { User, authApi } from '@/lib/api';

interface ModuleSettingsProps {
  user: User | null;
  onLogout: () => void;
}

export default function ModuleSettings({ user, onLogout }: ModuleSettingsProps) {
  const [form, setForm] = useState({
    name:           user?.name           ?? '',
    phone:          user?.phone          ?? '',
    upi_id:         user?.upi_id         ?? '',
    bank_name:      user?.bank_name      ?? '',
    account_number: user?.account_number ?? '',
    ifsc_code:      user?.ifsc_code      ?? '',
    account_holder: user?.account_holder ?? '',
  });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const inp = 'w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm text-[#101010] focus:outline-none focus:border-[#FFC107] transition-colors bg-white placeholder-[#bbb]';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
      // Update localStorage so Navbar/sidebar reflect new name immediately
      const stored = localStorage.getItem('moi_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('moi_user', JSON.stringify({ ...u, ...res.user }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const hasPaymentDetails = form.upi_id || form.account_number;

  return (
    <div className="max-w-xl space-y-5">
      {/* Profile */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h3 className="font-semibold text-[#101010] text-sm">Profile</h3>
          <p className="text-xs text-[#999] mt-0.5">Your name and contact details</p>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm">✓ Changes saved</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Display Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1.5">Email</label>
            <input value={user?.email ?? ''} disabled className={`${inp} bg-[#fafafa] text-[#bbb] cursor-not-allowed`} />
            <p className="text-[10px] text-[#ccc] mt-1">Email cannot be changed</p>
          </div>

          {/* ── Payment Details ── */}
          <div className="border-t border-[#F5F5F5] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-[#101010]">💳 Payment Details</h4>
              {hasPaymentDetails && (
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Saved</span>
              )}
            </div>
            <p className="text-xs text-[#999] mb-4 leading-relaxed">
              Add your UPI ID or bank account so guests know where to transfer moi.
              These details are shown on your event page when guests choose to pay offline.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#555] mb-1.5">UPI ID</label>
                <input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} className={inp} placeholder="yourname@upi" />
              </div>

              <div className="bg-[#fafafa] border border-[#F0F0F0] rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-[#666]">Bank Account (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#777] mb-1">Account Holder Name</label>
                    <input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} className={inp} placeholder="As per bank records" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] mb-1">Bank Name</label>
                    <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className={inp} placeholder="SBI / HDFC / etc." />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] mb-1">Account Number</label>
                    <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className={inp} placeholder="XXXXXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] mb-1">IFSC Code</label>
                    <input value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} className={inp} placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>
            </div>

            {/* How transfer works */}
            <div className="mt-4 bg-[#FFFCF5] border border-[#FFE082] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#B8860B] mb-2">ℹ️ How moi transfer works</p>
              <ul className="text-xs text-[#666] space-y-1.5 leading-relaxed">
                <li>• Guests who pay <strong>UPI / online</strong> — transfer directly to your UPI ID shown on the event page</li>
                <li>• Guests who pay <strong>cash</strong> — hand it over in person; you record it manually in the dashboard</li>
                <li>• Guests who pay <strong>bank transfer</strong> — use the account number above</li>
                <li>• MoiApp does <strong>not</strong> hold or process any money — all transfers go directly to you</li>
              </ul>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="bg-[#FFC107] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h3 className="font-semibold text-[#101010] text-sm">Account</h3>
        </div>
        <div className="divide-y divide-[#F8F8F8]">
          {[
            { label: 'User ID',     sub: 'Internal identifier',  value: `#${user?.id}` },
            { label: 'Plan',        sub: 'Current subscription', value: <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Free</span> },
            { label: 'App Version', sub: 'MoiApp dashboard',     value: 'v1.0.0' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-[#101010]">{row.label}</p>
                <p className="text-xs text-[#999]">{row.sub}</p>
              </div>
              <span className="text-sm text-[#666] font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100">
          <h3 className="font-semibold text-red-500 text-sm">Danger Zone</h3>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#101010]">Sign out</p>
            <p className="text-xs text-[#999]">Log out of your account on this device</p>
          </div>
          <button onClick={onLogout}
            className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
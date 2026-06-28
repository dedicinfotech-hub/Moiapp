'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { User, authApi, showSuccess } from '@/lib/api';

interface ModuleSettingsProps {
  user: User | null;
  onLogout: () => void;
}

export default function ModuleSettings({ user, onLogout }: ModuleSettingsProps) {
  const [form, setForm] = useState({
    name:           user?.name           ?? '',
    city:           user?.city           ?? '',
    phone:          user?.phone          ?? '',
    upi_id:         user?.upi_id         ?? '',
    bank_name:      user?.bank_name      ?? '',
    account_number: user?.account_number ?? '',
    ifsc_code:      user?.ifsc_code      ?? '',
    account_holder: user?.account_holder ?? '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifFunctionReminder, setNotifFunctionReminder] = useState(true);
  const [notifFunctionToday, setNotifFunctionToday] = useState(true);
  const [notifReturnGift, setNotifReturnGift] = useState(true);
  const [notifEntrySaved, setNotifEntrySaved] = useState(true);
  const [notifTime, setNotifTime] = useState('09:00');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  const inp = 'w-full border border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text focus:outline-none focus:border-tn-yellow transition-colors bg-white placeholder-tn-subtle';

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('moi_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setNotifFunctionReminder(settings.notifFunctionReminder ?? true);
      setNotifFunctionToday(settings.notifFunctionToday ?? true);
      setNotifReturnGift(settings.notifReturnGift ?? true);
      setNotifEntrySaved(settings.notifEntrySaved ?? true);
      setNotifTime(settings.notifTime ?? '09:00');
      setLanguage(settings.language ?? 'en');
      setFontSize(settings.fontSize ?? 'medium');
    }
  }, []);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontSize]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
      // Update localStorage so Navbar/sidebar reflect new name immediately
      const stored = localStorage.getItem('moi_user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        try {
          const u = JSON.parse(stored);
          localStorage.setItem('moi_user', JSON.stringify({ ...u, ...res.user }));
        } catch {
          localStorage.removeItem('moi_user');
        }
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
      {/* Profile - Modern design */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-border">
          <h3 className="font-semibold text-tn-text text-sm sm:text-base">Profile</h3>
          <p className="text-xs text-tn-muted mt-0.5">Your name and contact details</p>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {saved && (
            <div className="bg-tn-green-bg border border-tn-success text-tn-text rounded-xl px-4 py-2.5 text-sm">✓ Changes saved</div>
          )}
          {error && (
            <div className="bg-tn-red-bg border border-tn-error text-tn-text rounded-xl px-4 py-2.5 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tn-muted mb-1.5">Display Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tn-muted mb-1.5">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} placeholder="Your city" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+91 98765 43210" inputMode="tel" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1.5">Email</label>
            <input value={user?.email ?? ''} disabled className={`${inp} bg-tn-light text-tn-subtle cursor-not-allowed`} />
            <p className="text-xs text-tn-subtle mt-1">Email cannot be changed</p>
          </div>

          {/* ── Payment Details ── */}
          <div className="border-t border-tn-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-tn-text flex items-center gap-2"><Icon name="wallet" size={16} /> Payment Details</h4>
              {hasPaymentDetails && (
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Saved</span>
              )}
            </div>
            <p className="text-xs text-tn-muted mb-4 leading-relaxed">
              Add your UPI ID or bank account so guests know where to transfer moi.
              The UPI ID is used for Scan & Pay on guest payment pages.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-tn-muted mb-1.5">UPI ID</label>
                <input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} className={inp} placeholder="yourname@upi" />
              </div>

              <div className="bg-tn-light border border-tn-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-tn-muted">Bank Account (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">Account Holder Name</label>
                    <input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} className={inp} placeholder="As per bank records" />
                  </div>
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">Bank Name</label>
                    <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className={inp} placeholder="SBI / HDFC / etc." />
                  </div>
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">Account Number</label>
                    <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className={inp} placeholder="XXXXXXXXXXXX" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">IFSC Code</label>
                    <input value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} className={inp} placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>
            </div>

            {/* How transfer works */}
            <div className="mt-4 bg-tn-yellow-bg border border-tn-yellow-border rounded-xl p-4">
              <p className="text-xs font-semibold text-tn-gold mb-2">ℹ️ How moi transfer works</p>
              <ul className="text-xs text-tn-muted space-y-1.5 leading-relaxed">
                <li>• Guests who pay <strong>UPI / online</strong> — transfer directly to your UPI ID shown on the event page</li>
                <li>• Guests who pay <strong>cash</strong> — hand it over in person; you record it manually in the dashboard</li>
                <li>• Guests who pay <strong>bank transfer</strong> — use the account number above</li>
                <li>• MoiApp does <strong>not</strong> hold or process any money — all transfers go directly to you</li>
              </ul>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="bg-tn-yellow text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* App Settings - Modern design */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-border">
          <h3 className="font-semibold text-tn-text text-sm sm:text-base">App Settings</h3>
          <p className="text-xs text-tn-muted mt-0.5">Customize your app experience</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Notifications Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tn-text">Notifications</p>
              <p className="text-xs text-tn-muted">Master switch for all notifications</p>
            </div>
            <label className="relative inline-flex h-5 w-10 cursor-pointer rounded-full bg-tn-border transition-colors">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => {
                  setNotificationsEnabled(e.target.checked);
                  const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                  localStorage.setItem('moi_settings', JSON.stringify({ ...settings, notificationsEnabled: e.target.checked }));
                }}
                className="sr-only"
              />
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                notificationsEnabled ? 'translate-x-5' : ''
              }`} />
            </label>
          </div>

          {notificationsEnabled && (
            <>
              {/* Function Reminder (3 days before) */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tn-text">Function Reminder</p>
                  <p className="text-xs text-tn-muted">3 days before function date</p>
                </div>
                <label className="relative inline-flex h-5 w-10 cursor-pointer rounded-full bg-tn-border transition-colors">
                  <input
                    type="checkbox"
                    checked={notifFunctionReminder}
                    onChange={(e) => {
                      setNotifFunctionReminder(e.target.checked);
                      const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                      localStorage.setItem('moi_settings', JSON.stringify({ ...settings, notifFunctionReminder: e.target.checked }));
                    }}
                    className="sr-only"
                  />
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    notifFunctionReminder ? 'translate-x-5' : ''
                  }`} />
                </label>
              </div>

              {/* Function Today */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tn-text">Function Day Alert</p>
                  <p className="text-xs text-tn-muted">On the day of function</p>
                </div>
                <label className="relative inline-flex h-5 w-10 cursor-pointer rounded-full bg-tn-border transition-colors">
                  <input
                    type="checkbox"
                    checked={notifFunctionToday}
                    onChange={(e) => {
                      setNotifFunctionToday(e.target.checked);
                      const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                      localStorage.setItem('moi_settings', JSON.stringify({ ...settings, notifFunctionToday: e.target.checked }));
                    }}
                    className="sr-only"
                  />
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    notifFunctionToday ? 'translate-x-5' : ''
                  }`} />
                </label>
              </div>

              {/* Return Gift Reminder */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tn-text">Return Gift Reminder</p>
                  <p className="text-xs text-tn-muted">Weekly reminder for pending returns</p>
                </div>
                <label className="relative inline-flex h-5 w-10 cursor-pointer rounded-full bg-tn-border transition-colors">
                  <input
                    type="checkbox"
                    checked={notifReturnGift}
                    onChange={(e) => {
                      setNotifReturnGift(e.target.checked);
                      const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                      localStorage.setItem('moi_settings', JSON.stringify({ ...settings, notifReturnGift: e.target.checked }));
                    }}
                    className="sr-only"
                  />
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    notifReturnGift ? 'translate-x-5' : ''
                  }`} />
                </label>
              </div>

              {/* Entry Save Confirmation */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tn-text">Entry Save Confirmation</p>
                  <p className="text-xs text-tn-muted">Show notification when moi entry is saved</p>
                </div>
                <label className="relative inline-flex h-5 w-10 cursor-pointer rounded-full bg-tn-border transition-colors">
                  <input
                    type="checkbox"
                    checked={notifEntrySaved}
                    onChange={(e) => {
                      setNotifEntrySaved(e.target.checked);
                      const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                      localStorage.setItem('moi_settings', JSON.stringify({ ...settings, notifEntrySaved: e.target.checked }));
                    }}
                    className="sr-only"
                  />
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    notifEntrySaved ? 'translate-x-5' : ''
                  }`} />
                </label>
              </div>

              {/* Notification Time */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tn-text">Default Notification Time</p>
                  <p className="text-xs text-tn-muted">Preferred time to receive reminders</p>
                </div>
                <input
                  type="time"
                  value={notifTime}
                  onChange={(e) => {
                    setNotifTime(e.target.value);
                    const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                    localStorage.setItem('moi_settings', JSON.stringify({ ...settings, notifTime: e.target.value }));
                  }}
                  className="border border-tn-border rounded-lg px-3 py-1.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow"
                />
              </div>
            </>
          )}

          {/* Language Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tn-text">Language</p>
              <p className="text-xs text-tn-muted">App language preference</p>
            </div>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as 'en' | 'ta');
                const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                localStorage.setItem('moi_settings', JSON.stringify({ ...settings, language: e.target.value }));
              }}
              className="border border-tn-border rounded-lg px-3 py-1.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tn-text">Font Size</p>
              <p className="text-xs text-tn-muted">Adjust text size for better readability</p>
            </div>
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value as 'small' | 'medium' | 'large');
                const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
                localStorage.setItem('moi_settings', JSON.stringify({ ...settings, fontSize: e.target.value }));
              }}
              className="border border-tn-border rounded-lg px-3 py-1.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-border">
          <h3 className="font-semibold text-tn-text text-sm">Account</h3>
        </div>
        <div className="divide-y divide-tn-border">
          {[
            { label: 'User ID',     sub: 'Internal identifier',  value: `#${user?.id}` },
            { label: 'Plan',        sub: 'Current subscription', value: <span className="text-[10px] font-bold bg-tn-green-bg text-tn-text px-2.5 py-1 rounded-full">Free</span> },
            { label: 'App Version', sub: 'MoiApp dashboard',     value: 'v1.0.0' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-tn-text">{row.label}</p>
                <p className="text-xs text-tn-muted">{row.sub}</p>
              </div>
              <span className="text-sm text-tn-muted font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-tn-error/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-error/20">
          <h3 className="font-semibold text-tn-error text-sm">Danger Zone</h3>
        </div>
        <div className="divide-y divide-tn-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-tn-text">Sign out</p>
              <p className="text-xs text-tn-muted">Log out of your account on this device</p>
            </div>
            <button onClick={onLogout}
              className="px-4 py-2 border border-tn-error/20 text-tn-error rounded-lg text-sm font-semibold hover:bg-tn-error-bg transition-colors">
              Sign Out
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-tn-error">Delete Account</p>
              <p className="text-xs text-tn-muted">Account will be deleted after 30-day grace period</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-tn-error/20 text-tn-error rounded-lg text-sm font-semibold hover:bg-tn-error-bg transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <h3 className="font-semibold text-tn-text mb-2">Delete Account</h3>
            <p className="text-sm text-tn-muted mb-4">
              Your account will be scheduled for deletion. After a 30-day grace period, all your data will be permanently removed. You can cancel this anytime within the grace period.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-tn-border text-tn-muted rounded-lg text-sm font-semibold hover:bg-tn-light">
                Cancel
              </button>
              <button onClick={() => {
                showSuccess('Account deletion scheduled. You have 30 days to cancel.');
                setShowDeleteConfirm(false);
              }}
                className="px-4 py-2 bg-tn-error text-white rounded-lg text-sm font-semibold hover:bg-tn-error/80">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
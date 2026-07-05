'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';
import { User, authApi, showSuccess } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface ModuleSettingsProps {
  user: User | null;
  onLogout: () => void;
}

export default function ModuleSettings({ user, onLogout }: ModuleSettingsProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifFunctionReminder, setNotifFunctionReminder] = useState(true);
  const [notifFunctionToday, setNotifFunctionToday] = useState(true);
  const [notifReturnGift, setNotifReturnGift] = useState(true);
  const [notifEntrySaved, setNotifEntrySaved] = useState(true);
  const [notifTime, setNotifTime] = useState('09:00');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

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
      setFontSize(settings.fontSize ?? 'medium');
    }
  }, []);

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

  return (
    <div className="max-w-xl space-y-5">
      <Link
        href="/dashboard?module=profile"
        className="block bg-white border border-tn-border rounded-xl overflow-hidden hover:border-tn-yellow transition-colors"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-tn-text">{t('profile')}</p>
            <p className="text-xs text-tn-muted mt-0.5">{t('profileDetailsSub')}</p>
          </div>
          <span className="text-tn-muted text-lg">›</span>
        </div>
      </Link>

      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-border">
          <h3 className="font-semibold text-tn-text text-sm sm:text-base">{t('appSettings')}</h3>
          <p className="text-xs text-tn-muted mt-0.5">{t('modSettingsSub')}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tn-text">{t('notifications')}</p>
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
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  notificationsEnabled ? 'translate-x-5' : ''
                }`}
              />
            </label>
          </div>

          {notificationsEnabled && (
            <>
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
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                      notifFunctionReminder ? 'translate-x-5' : ''
                    }`}
                  />
                </label>
              </div>

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
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                      notifFunctionToday ? 'translate-x-5' : ''
                    }`}
                  />
                </label>
              </div>

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
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                      notifReturnGift ? 'translate-x-5' : ''
                    }`}
                  />
                </label>
              </div>

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
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                      notifEntrySaved ? 'translate-x-5' : ''
                    }`}
                  />
                </label>
              </div>

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

          <LanguageSelector />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tn-text">{t('fontSize')}</p>
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
              <option value="small">{t('small')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="large">{t('large')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-border">
          <h3 className="font-semibold text-tn-text text-sm">Account</h3>
        </div>
        <div className="divide-y divide-tn-border">
          {[
            { label: 'User ID', sub: 'Internal identifier', value: `#${user?.id}` },
            {
              label: 'Plan',
              sub: 'Current subscription',
              value: <span className="text-[10px] font-bold bg-tn-green-bg text-tn-text px-2.5 py-1 rounded-full">Free</span>,
            },
            { label: 'App Version', sub: 'Moi PassBook dashboard', value: 'v1.0.0' },
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

      <div className="bg-white border border-tn-error/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-error/20">
          <h3 className="font-semibold text-tn-error text-sm">Danger Zone</h3>
        </div>
        <div className="divide-y divide-tn-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-tn-text">{t('signOut')}</p>
              <p className="text-xs text-tn-muted">Log out of your account on this device</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 border border-tn-error/20 text-tn-error rounded-lg text-sm font-semibold hover:bg-tn-error-bg transition-colors"
            >
              {t('signOut')}
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-tn-error">{t('deleteAccount')}</p>
              <p className="text-xs text-tn-muted">Account will be deleted after 30-day grace period</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-tn-error/20 text-tn-error rounded-lg text-sm font-semibold hover:bg-tn-error-bg transition-colors"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <h3 className="font-semibold text-tn-text mb-2">{t('deleteAccount')}</h3>
            <p className="text-sm text-tn-muted mb-4">
              Your account will be scheduled for deletion. After a 30-day grace period, all your data will be permanently removed. You can cancel this anytime within the grace period.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-tn-border text-tn-muted rounded-lg text-sm font-semibold hover:bg-tn-light"
              >
                {t('cancel')}
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await authApi.deleteAccount();
                    showSuccess(res.message || 'Account scheduled for deletion');
                    setShowDeleteConfirm(false);
                    onLogout();
                  } catch (err: unknown) {
                    showSuccess(err instanceof Error ? err.message : 'Failed to delete account');
                  }
                }}
                className="px-4 py-2 bg-tn-error text-white rounded-lg text-sm font-semibold hover:bg-tn-error/80"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

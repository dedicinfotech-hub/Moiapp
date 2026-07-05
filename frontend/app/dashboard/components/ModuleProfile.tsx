'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { User, authApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface ModuleProfileProps {
  user: User | null;
}

export default function ModuleProfile({ user }: ModuleProfileProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    city: user?.city ?? '',
    phone: user?.phone ?? '',
    upi_id: user?.upi_id ?? '',
    bank_name: user?.bank_name ?? '',
    account_number: user?.account_number ?? '',
    ifsc_code: user?.ifsc_code ?? '',
    account_holder: user?.account_holder ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inp =
    'w-full border border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text focus:outline-none focus:border-tn-yellow transition-colors bg-white placeholder-tn-subtle';

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      city: user.city ?? '',
      phone: user.phone ?? '',
      upi_id: user.upi_id ?? '',
      bank_name: user.bank_name ?? '',
      account_number: user.account_number ?? '',
      ifsc_code: user.ifsc_code ?? '',
      account_holder: user.account_holder ?? '',
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
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
      setError(err instanceof Error ? err.message : t('profileSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const hasPaymentDetails = form.upi_id || form.account_number;

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tn-border">
          <h3 className="font-semibold text-tn-text text-sm sm:text-base">{t('profileDetails')}</h3>
          <p className="text-xs text-tn-muted mt-0.5">{t('profileDetailsSub')}</p>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {saved && (
            <div className="bg-tn-green-bg border border-tn-success text-tn-text rounded-xl px-4 py-2.5 text-sm">
              ✓ {t('profileSaved')}
            </div>
          )}
          {error && (
            <div className="bg-tn-red-bg border border-tn-error text-tn-text rounded-xl px-4 py-2.5 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tn-muted mb-1.5">{t('lblDisplayName')} *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inp}
                placeholder={t('phFullName')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tn-muted mb-1.5">{t('lblCity')}</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inp}
                placeholder={t('phCity')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1.5">{t('phone')}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inp}
              placeholder={t('phMobile')}
              inputMode="tel"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1.5">{t('email')}</label>
            <input value={user?.email ?? ''} disabled className={`${inp} bg-tn-light text-tn-subtle cursor-not-allowed`} />
            <p className="text-xs text-tn-subtle mt-1">{t('emailCannotChange')}</p>
          </div>

          <div className="border-t border-tn-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-tn-text flex items-center gap-2">
                <Icon name="wallet" size={16} /> {t('paymentDetails')}
              </h4>
              {hasPaymentDetails && (
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{t('saved')}</span>
              )}
            </div>
            <p className="text-xs text-tn-muted mb-4 leading-relaxed">{t('paymentDetailsSub')}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-tn-muted mb-1.5">{t('lblUpiId')}</label>
                <input
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className={inp}
                  placeholder="yourname@upi"
                />
              </div>

              <div className="bg-tn-light border border-tn-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-tn-muted">{t('bankAccountOptional')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">{t('lblAccountHolder')}</label>
                    <input
                      value={form.account_holder}
                      onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                      className={inp}
                      placeholder={t('phAccountHolder')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">{t('lblBankName')}</label>
                    <input
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      className={inp}
                      placeholder={t('phBankName')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">{t('lblAccountNumber')}</label>
                    <input
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                      className={inp}
                      placeholder="XXXXXXXXXXXX"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-tn-muted mb-1">{t('lblIfsc')}</label>
                    <input
                      value={form.ifsc_code}
                      onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })}
                      className={inp}
                      placeholder="SBIN0001234"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-tn-yellow text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50"
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}

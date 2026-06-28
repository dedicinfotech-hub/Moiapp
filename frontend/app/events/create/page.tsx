'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, showSuccess } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CreateFlowHeader, CreateStepProgress } from '@/components/event/EventLayout';

type Step = 'details' | 'settings' | 'review';

function IconField({
  icon,
  rightIcon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-secondary">{icon}</div>
      {rightIcon && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightIcon}</div>}
      <input
        {...props}
        className={`w-full bg-white border border-tn-border-alt rounded-xl pl-11 pr-4 py-3.5 text-sm text-tn-text placeholder-tn-text-secondary focus:outline-none focus:border-tn-purple-text transition-colors ${rightIcon ? 'pr-11' : ''} ${props.className || ''}`}
      />
    </div>
  );
}

export default function CreateFunctionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [mode, setMode] = useState<'new' | 'past'>('new');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    event_type: 'wedding' as 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'graduation' | 'custom',
    custom_title: '',
    bride_name: '',
    groom_name: '',
    wedding_date: '',
    wedding_time: '',
    venue: '',
    city: '',
    description: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'past' || modeParam === 'new') setMode(modeParam);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-tn-text-secondary">Please <Link href="/login" className="text-tn-purple-text underline">login</Link> first.</p>
      </div>
    );
  }

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const stepNum = step === 'details' ? 2 : step === 'settings' ? 3 : 4;

  const selectedTypeLabel = {
    wedding: 'Wedding', birthday: 'Birthday', engagement: 'Engagement',
    valakaappu: 'Valaikappu', housewarming: 'Housewarming', graduation: 'Graduation', custom: 'Custom Event',
  }[form.event_type];

  const modeLabel = mode === 'new' ? 'New Event (இனி நடக்கப்போகிறது)' : 'Past Event (ஏற்கனவே நடந்தது)';

  const buildSubmitData = (asDraft: boolean) => {
    const eventDate = form.wedding_date
      ? new Date(form.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const autoTitle = form.custom_title || `${selectedTypeLabel} - ${eventDate}`;

    const submitData: Record<string, unknown> = {
      event_type: form.event_type,
      event_mode: mode,
      wedding_date: form.wedding_date,
      wedding_time: form.wedding_time,
      venue: form.venue || '',
      city: form.city || '',
      description: form.description,
      custom_title: autoTitle,
      approval_status: asDraft ? 'draft' : mode === 'past' ? 'approved' : 'pending',
    };

    if (form.bride_name) submitData.bride_name = form.bride_name;
    if (form.groom_name) submitData.groom_name = form.groom_name;
    return submitData;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await eventsApi.create(buildSubmitData(true));
      showSuccess('Draft saved successfully');
      router.push(`/events/${res.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await eventsApi.create(buildSubmitData(false));
      if (mode === 'past' || res.approval_status === 'approved') {
        showSuccess('Function created successfully');
        router.push(`/events/${res.slug}/dashboard-empty`);
      } else {
        router.push(`/events/${res.slug}/pending`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create function');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CreateFlowHeader title="Create Function" onBack={() => router.push('/events/choose-type')} />
      <CreateStepProgress currentStep={stepNum as 1 | 2 | 3 | 4} />

      <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
        {/* Event type summary */}
        <div className="bg-white border border-tn-border-alt rounded-xl p-4 mb-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-tn-purple-bg flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-purple-text">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-tn-text-secondary">Event Type</p>
              <p className="text-sm font-bold text-tn-purple">{modeLabel}</p>
            </div>
          </div>
          <button type="button" onClick={() => router.push('/events/choose-type')} className="text-xs text-tn-purple-text font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Change
          </button>
        </div>

        {error && (
          <div className="bg-tn-red-bg border border-tn-red-bg rounded-xl px-4 py-3 text-sm mb-5 text-tn-error">{error}</div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-tn-text mb-2">Function Name <span className="text-tn-error">*</span></label>
              <IconField
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  </svg>
                }
                required
                value={form.custom_title}
                onChange={(e) => update('custom_title', e.target.value.slice(0, 50))}
                placeholder="Enter function name"
                maxLength={50}
              />
              <p className="text-[10px] text-tn-text-secondary mt-1 text-right">{form.custom_title.length}/50</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-tn-text mb-2">Date <span className="text-tn-error">*</span></label>
                <IconField
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    </svg>
                  }
                  type="date"
                  required
                  value={form.wedding_date}
                  onChange={(e) => update('wedding_date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-tn-text mb-2">Time <span className="text-tn-error">*</span></label>
                <IconField
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  type="time"
                  required
                  value={form.wedding_time}
                  onChange={(e) => update('wedding_time', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-tn-text mb-2">Venue</label>
              <IconField
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
                placeholder="Enter venue name / address"
                rightIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
                  </svg>
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-tn-text mb-2">City</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
                  </svg>
                </div>
                <select
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="w-full bg-white border border-tn-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-tn-text focus:outline-none focus:border-tn-purple-text appearance-none"
                >
                  <option value="">Select city</option>
                  {['Coimbatore', 'Chennai', 'Madurai', 'Salem', 'Trichy', 'Erode', 'Tiruppur', 'Other'].map((c) => (
                    <option key={c} value={c === 'Other' ? '' : c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-tn-text mb-2">Description <span className="text-tn-text-secondary font-normal">(Optional)</span></label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value.slice(0, 200))}
                  className="w-full bg-white border border-tn-border-alt rounded-xl px-4 py-3.5 text-sm text-tn-text placeholder-tn-text-secondary focus:outline-none focus:border-tn-purple-text resize-none"
                  placeholder="Add a short description about the function"
                  maxLength={200}
                />
                <p className="text-[10px] text-tn-text-secondary mt-1 text-right">{form.description.length}/200</p>
              </div>
            </div>

            <div className="bg-tn-purple-bg rounded-xl p-4 flex items-start gap-3">
              <svg className="shrink-0 text-tn-purple-text" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="text-sm font-bold text-tn-purple">Why do we need this?</p>
                <p className="text-xs text-tn-text-secondary mt-0.5">These details will be shown to your guests on the invitation page.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'settings' && (
          <div className="bg-white border border-tn-border-alt rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-tn-text">Event Settings</h3>
            {[
              { label: 'QR Code Collection', desc: 'Allow guests to scan and pay via QR', on: mode === 'new' },
              { label: 'Guest Contributions', desc: 'Allow guests to add moi entries', on: mode === 'new' },
              { label: 'Approval Required', desc: 'Admin must approve before going live', on: mode === 'new' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tn-text">{item.label}</p>
                  <p className="text-[10px] text-tn-text-secondary">{item.desc}</p>
                </div>
                <div className={`w-11 h-6 rounded-full relative ${item.on ? 'bg-tn-purple' : 'bg-tn-border-alt'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.on ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 'review' && (
          <div className="bg-white border border-tn-border-alt rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-tn-text mb-2">Function Summary</h3>
            {[
              ['Function Name', form.custom_title || `${selectedTypeLabel}`],
              ['Event Type', modeLabel],
              ['Date', form.wedding_date || '—'],
              ['Time', form.wedding_time || '—'],
              ['Venue', form.venue || '—'],
              ['City', form.city || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-xs text-tn-text-secondary">{label}</span>
                <span className="text-xs font-semibold text-tn-text text-right">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3 pb-6">
          {step === 'details' && (
            <button type="button" onClick={() => setStep('settings')} className="w-full h-[52px] bg-tn-purple text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-tn-purple-2">
              Save & Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          )}
          {step === 'settings' && (
            <>
              <button type="button" onClick={() => setStep('review')} className="w-full h-[52px] bg-tn-purple text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-tn-purple-2">
                Save & Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button type="button" onClick={handleSaveDraft} disabled={saving} className="w-full h-[52px] border-2 border-tn-purple-text text-tn-purple rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Save as Draft
              </button>
            </>
          )}
          {step === 'review' && (
            <>
              <button type="button" onClick={handleSubmit} disabled={saving} className="w-full h-[52px] bg-tn-purple text-white rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Submitting…' : mode === 'past' ? 'Create Function' : 'Submit for Approval'}
              </button>
              <button type="button" onClick={handleSaveDraft} disabled={saving} className="w-full h-[52px] border-2 border-tn-purple-text text-tn-purple rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                Save as Draft
              </button>
            </>
          )}
          {step !== 'details' && (
            <button type="button" onClick={() => setStep(step === 'review' ? 'settings' : 'details')} className="w-full text-sm text-tn-text-secondary py-2">
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

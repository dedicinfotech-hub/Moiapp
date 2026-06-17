'use client';

import { useState, useRef } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { Event, eventsApi, showSuccess } from '@/lib/api';
import ApprovalBanner from '@/components/ApprovalBanner';

interface EditEventModalProps {
  event: Event;
  onClose: () => void;
  onUpdated: () => void;
}

type EventType = 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'graduation' | 'custom';
type Step = 1 | 2 | 3;

const EVENT_TYPES: { value: EventType; label: string; icon: IconName }[] = [
  { value: 'wedding', label: 'Wedding', icon: 'wedding' },
  { value: 'birthday', label: 'Birthday', icon: 'sparkle' },
  { value: 'engagement', label: 'Engagement', icon: 'wedding' },
  { value: 'valakaappu', label: 'Valakaappu', icon: 'sparkle' },
  { value: 'housewarming', label: 'Housewarming', icon: 'venue' },
  { value: 'graduation', label: 'Graduation', icon: 'sparkle' },
  { value: 'custom', label: 'Custom', icon: 'sparkle' },
];

export default function EditEventModal({
  event,
  onClose,
  onUpdated,
}: EditEventModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    event_type: event.event_type || 'wedding',
    custom_title: event.custom_title || '',
    bride_name: event.bride_name || '',
    groom_name: event.groom_name || '',
    birthday_person_name: event.birthday_person_name || '',
    birthday_person_age: event.birthday_person_age?.toString() || '',
    parent1_name: event.parent1_name || '',
    parent2_name: event.parent2_name || '',
    mother_name: event.mother_name || '',
    father_name: event.father_name || '',
    host_name: event.host_name || '',
    spouse_name: event.spouse_name || '',
    graduate_name: event.graduate_name || '',
    wedding_date: event.wedding_date,
    city: event.city || '',
    venue: event.venue || '',
    venue_latitude: event.venue_latitude?.toString() || '',
    venue_longitude: event.venue_longitude?.toString() || '',
    description: event.description || '',
  });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(event.cover_photo);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inp = 'w-full border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-text placeholder-tn-text-secondary focus:outline-none focus:border-tn-yellow transition-colors bg-white';
  const lbl = 'block text-xs font-semibold text-tn-muted mb-1.5';

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const submitData: Record<string, unknown> = {
        event_type: form.event_type,
        wedding_date: form.wedding_date,
        city: form.city,
        venue: form.venue,
        venue_latitude: form.venue_latitude ? parseFloat(form.venue_latitude) : null,
        venue_longitude: form.venue_longitude ? parseFloat(form.venue_longitude) : null,
        description: form.description,
      };

      if (form.event_type === 'wedding') {
        submitData.bride_name = form.bride_name;
        submitData.groom_name = form.groom_name;
      } else if (form.event_type === 'birthday') {
        submitData.birthday_person_name = form.birthday_person_name;
        submitData.birthday_person_age = form.birthday_person_age ? parseInt(form.birthday_person_age) : null;
      } else if (form.event_type === 'custom') {
        submitData.custom_title = form.custom_title;
      } else if (form.event_type === 'engagement') {
        submitData.bride_name = form.bride_name;
        submitData.groom_name = form.groom_name;
        submitData.parent1_name = form.parent1_name;
        submitData.parent2_name = form.parent2_name;
        submitData.mother_name = form.mother_name;
        submitData.father_name = form.father_name;
      } else if (form.event_type === 'valakaappu') {
        submitData.bride_name = form.bride_name;
        submitData.groom_name = form.groom_name;
      } else if (form.event_type === 'housewarming') {
        submitData.host_name = form.host_name;
        submitData.spouse_name = form.spouse_name;
      } else if (form.event_type === 'graduation') {
        submitData.graduate_name = form.graduate_name;
      }

      const res = await eventsApi.update(event.id, submitData);
      if (res.resubmitted) {
        showSuccess('Changes saved and resubmitted for approval');
      } else {
        showSuccess('Event updated');
      }
      if (coverFile) {
        const token = localStorage.getItem('moi_token');
        const fd = new FormData();
        fd.append('event_id', String(event.id));
        fd.append('cover', coverFile);
        const coverRes = await fetch(`${BASE_URL}/events.php?action=cover`, {
          method: 'POST',
          headers: { 'X-Auth-Token': `Bearer ${token}` },
          body: fd,
        });
        if (!coverRes.ok) {
          const errorData = await coverRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload cover photo');
        }
      }
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const selectedType = EVENT_TYPES.find(t => t.value === form.event_type);
  const eventTitle = form.event_type === 'custom' 
    ? (form.custom_title ? `Edit ${form.custom_title} Event` : 'Edit Custom Event')
    : `Edit ${selectedType?.label || 'Event'}`;
  const eventIcon = selectedType?.icon || 'sparkle';

  // Get appropriate name field labels based on event type
  const getNameFieldLabels = () => {
    if (form.event_type === 'wedding') {
      return { name1: 'Bride Name', name2: 'Groom Name', placeholder1: 'Priya', placeholder2: 'Ravi' };
    } else if (form.event_type === 'engagement') {
      return { name1: 'Partner 1 Name', name2: 'Partner 2 Name', placeholder1: 'Priya', placeholder2: 'Ravi' };
    } else if (form.event_type === 'valakaappu') {
      return { name1: 'Mother Name', name2: 'Father Name', placeholder1: 'Lakshmi', placeholder2: 'Ravi' };
    } else if (form.event_type === 'housewarming') {
      return { name1: 'Host Name', name2: 'Spouse Name', placeholder1: 'Arun', placeholder2: 'Priya' };
    }
    return { name1: 'Name 1', name2: 'Name 2', placeholder1: '', placeholder2: '' };
  };

  const nameLabels = getNameFieldLabels();

  const steps = [
    { num: 1, label: 'Event Type' },
    { num: 2, label: 'Event Details' },
    { num: 3, label: 'Review' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tn-border-alt">
          <div className="flex items-center gap-2.5">
            <Icon name={eventIcon} />
            <div>
              <h2 className="font-bold text-tn-text text-base leading-tight">{eventTitle}</h2>
              <p className="text-[11px] text-tn-text-secondary">
                {step === 1 && 'Select event type'}
                {step === 2 && 'Edit event details'}
                {step === 3 && 'Review & save'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 flex items-center justify-center rounded-full text-tn-text-secondary hover:bg-tn-light-alt hover:text-tn-text transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Progress Stepper */}
        {step < 3 && (
          <div className="px-6 py-4 border-b border-tn-border-alt">
            <div className="flex items-start justify-between max-w-xs mx-auto">
              {steps.map((s, idx) => {
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center flex-1 relative">
                    {idx > 0 && (
                      <div
                        className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${isDone || isActive ? 'bg-tn-yellow' : 'bg-tn-border'}`}
                        style={{ width: '100%', transform: 'translateX(-50%)' }}
                      />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive || isDone ? 'bg-tn-yellow text-black' : 'bg-tn-border text-tn-text-secondary'
                    }`}>
                      {isDone ? '✓' : s.num}
                    </div>
                    <p className={`text-[9px] mt-1.5 font-medium text-center leading-tight max-w-[64px] ${
                      isActive ? 'text-tn-text font-semibold' : isDone ? 'text-tn-text' : 'text-tn-text-secondary'
                    }`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-6 py-5">
          {error && <div className="bg-tn-red-bg border border-tn-red-soft text-tn-red-soft rounded-lg px-4 py-2.5 text-sm mb-4">{error}</div>}
          <ApprovalBanner event={event} />

          {/* Step 1: Event Type Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Event Type <span className="text-tn-yellow">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, event_type: type.value })}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 font-semibold text-xs transition-all ${
                        form.event_type === type.value
                          ? 'border-tn-yellow bg-tn-yellow-light text-tn-text'
                          : 'border-tn-border text-tn-text-secondary hover:border-tn-border-alt'
                      }`}
                    >
                      <span className="text-lg text-tn-gold"><Icon name={type.icon} size={20} /></span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Title - only for custom events */}
              {form.event_type === 'custom' && (
                <div>
                  <label className={lbl}>Event Title <span className="text-tn-yellow">*</span></label>
                  <input
                    required
                    value={form.custom_title}
                    onChange={(e) => setForm({ ...form, custom_title: e.target.value })}
                    className={inp}
                    placeholder="e.g., Anniversary, Naming Ceremony"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 border border-tn-border text-tn-text-secondary py-2.5 rounded-lg text-sm font-semibold hover:border-tn-border-alt transition-colors">Cancel</button>
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-tn-yellow text-black py-2.5 rounded-lg text-sm font-bold hover:bg-tn-gold transition-colors">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Event Details */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              {form.event_type === 'wedding' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Bride Name <span className="text-tn-yellow">*</span></label>
                    <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
                  </div>
                  <div>
                    <label className={lbl}>Groom Name <span className="text-tn-yellow">*</span></label>
                    <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
                  </div>
                </div>
              ) : form.event_type === 'birthday' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Person Name <span className="text-tn-yellow">*</span></label>
                    <input required value={form.birthday_person_name} onChange={(e) => setForm({ ...form, birthday_person_name: e.target.value })} className={inp} placeholder="Arun" />
                  </div>
                  <div>
                    <label className={lbl}>Age</label>
                    <input type="number" min="1" max="120" value={form.birthday_person_age} onChange={(e) => setForm({ ...form, birthday_person_age: e.target.value })} className={inp} placeholder="25" />
                  </div>
                </div>
              ) : form.event_type === 'engagement' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Partner 1 Name <span className="text-tn-yellow">*</span></label>
                      <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
                    </div>
                    <div>
                      <label className={lbl}>Partner 2 Name <span className="text-tn-yellow">*</span></label>
                      <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Mother Name <span className="text-tn-yellow">*</span></label>
                      <input required value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} className={inp} placeholder="Lakshmi" />
                    </div>
                    <div>
                      <label className={lbl}>Father Name <span className="text-tn-yellow">*</span></label>
                      <input required value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className={inp} placeholder="Ravi" />
                    </div>
                  </div>
                </div>
              ) : form.event_type === 'valakaappu' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>{nameLabels.name1} <span className="text-tn-yellow">*</span></label>
                    <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder={nameLabels.placeholder1} />
                  </div>
                  <div>
                    <label className={lbl}>{nameLabels.name2} <span className="text-tn-yellow">*</span></label>
                    <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder={nameLabels.placeholder2} />
                  </div>
                </div>
              ) : form.event_type === 'housewarming' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Host Name <span className="text-tn-yellow">*</span></label>
                    <input required value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} className={inp} placeholder="Arun" />
                  </div>
                  <div>
                    <label className={lbl}>Spouse Name <span className="text-tn-yellow">*</span></label>
                    <input required value={form.spouse_name} onChange={(e) => setForm({ ...form, spouse_name: e.target.value })} className={inp} placeholder="Priya" />
                  </div>
                </div>
              ) : form.event_type === 'graduation' ? (
                <div>
                  <label className={lbl}>Graduate Name <span className="text-tn-yellow">*</span></label>
                  <input required value={form.graduate_name} onChange={(e) => setForm({ ...form, graduate_name: e.target.value })} className={inp} placeholder="Arun" />
                </div>
              ) : null}
              <div>
                <label className={lbl}>Event Date <span className="text-tn-yellow">*</span></label>
                <input required type="date" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} placeholder="Chennai" />
              </div>
              <div>
                <label className={lbl}>Venue</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inp} placeholder="Sri Murugan Mahal, Chennai" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Latitude</label>
                  <input type="number" step="any" value={form.venue_latitude} onChange={(e) => setForm({ ...form, venue_latitude: e.target.value })} className={inp} placeholder="13.0827" />
                </div>
                <div>
                  <label className={lbl}>Longitude</label>
                  <input type="number" step="any" value={form.venue_longitude} onChange={(e) => setForm({ ...form, venue_longitude: e.target.value })} className={inp} placeholder="80.2707" />
                </div>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} resize-none`} placeholder="A brief note about the event…" />
              </div>

              {/* Cover Photo */}
              <div>
                <label className={lbl}>Cover Photo</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${coverPreview ? 'border-tn-yellow' : 'border-tn-border hover:border-tn-yellow'}`}
                >
                  {coverPreview ? (
                    <div className="relative h-32">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-semibold">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 flex flex-col items-center justify-center gap-1.5 text-tn-muted">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <p className="text-xs font-semibold text-tn-text">Drag & Drop</p>
                      <p className="text-[10px] text-tn-subtle">or click to upload cover photo</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-tn-border text-tn-text-secondary py-2.5 rounded-lg text-sm font-semibold hover:border-tn-border-alt transition-colors">← Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-tn-yellow text-black py-2.5 rounded-lg text-sm font-bold hover:bg-tn-gold transition-colors disabled:opacity-50">
                  {loading ? 'Saving…' : 'Save Changes →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-16 h-16 bg-tn-yellow-light border-2 border-tn-yellow rounded-full flex items-center justify-center text-3xl">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-tn-text mb-1">Event Updated!</h3>
                <p className="text-xs text-tn-text-secondary leading-relaxed">
                  Your event has been successfully updated.<br />
                  Changes are now saved.
                </p>
              </div>
              <button type="button" onClick={onUpdated} className="w-full bg-tn-yellow text-black py-2.5 rounded-lg text-sm font-bold hover:bg-tn-gold transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

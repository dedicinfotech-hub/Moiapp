  'use client';

import { useState, useRef } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi } from '@/lib/api';

interface NewEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type EventType = 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'graduation' | 'custom';
type Step = 1 | 2 | 3;

const EVENT_TYPES: { value: EventType; label: string; icon: IconName }[] = [
  { value: 'wedding', label: 'Wedding', icon: 'venue' },
  { value: 'birthday', label: 'Birthday', icon: 'gift' },
  { value: 'engagement', label: 'Engagement', icon: 'wedding' },
  { value: 'valakaappu', label: 'Valakaappu', icon: 'sparkle' },
  { value: 'housewarming', label: 'Housewarming', icon: 'venue' },
  { value: 'graduation', label: 'Graduation', icon: 'sparkle' },
  { value: 'custom', label: 'Others', icon: 'sparkle' },
];

export default function NewEventModal({ onClose, onCreated }: NewEventModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    event_type: 'wedding' as EventType,
    event_mode: 'new' as 'past' | 'new',
    function_name: '',
    custom_title: '',
    bride_name: '',
    groom_name: '',
    birthday_person_name: '',
    birthday_person_age: '',
    parent1_name: '',
    parent2_name: '',
    mother_name: '',
    father_name: '',
    host_name: '',
    spouse_name: '',
    graduate_name: '',
    wedding_date: '',
    venue: '',
    city: '',
    venue_latitude: '',
    venue_longitude: '',
    description: '',
  });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [functionNameManualEdit, setFunctionNameManualEdit] = useState(false);
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
  const todayStr = new Date().toISOString().split('T')[0];
  const isPast = form.event_mode === 'past';

  const handleModeChange = (mode: 'past' | 'new') => {
    setForm((prev) => {
      let wedding_date = prev.wedding_date;
      if (mode === 'past' && wedding_date > todayStr) wedding_date = todayStr;
      if (mode === 'new' && wedding_date < todayStr) wedding_date = todayStr;
      return { ...prev, event_mode: mode, wedding_date };
    });
  };

  const handleStep1Continue = () => {
    // Pre-populate function name based on event type and existing name fields
    setForm((prev) => {
      let fn = prev.function_name;
      // Only auto-populate if not in manual edit mode
      if (!functionNameManualEdit && !fn) {
        if (prev.event_type === 'wedding' && prev.bride_name && prev.groom_name) {
          fn = `${prev.bride_name} & ${prev.groom_name} Wedding`;
        } else if (prev.event_type === 'birthday' && prev.birthday_person_name) {
          fn = `${prev.birthday_person_name}'s Birthday Celebration`;
        } else if (prev.event_type === 'engagement' && prev.mother_name && prev.father_name) {
          fn = `${prev.mother_name} & ${prev.father_name} Engagement`;
        } else if (prev.event_type === 'valakaappu' && prev.mother_name && prev.father_name) {
          fn = `${prev.mother_name} & ${prev.father_name} Valakaappu`;
        } else if (prev.event_type === 'housewarming' && prev.host_name) {
          fn = `${prev.host_name}${prev.spouse_name ? ' & ' + prev.spouse_name : ''} Housewarming`;
        } else if (prev.event_type === 'graduation' && prev.graduate_name) {
          fn = `${prev.graduate_name}'s Graduation`;
        } else if (prev.event_type === 'custom' && prev.custom_title) {
          fn = prev.custom_title;
        }
      }
      return { ...prev, function_name: fn };
    });
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const submitData: Record<string, unknown> = {
        event_type: form.event_type,
        event_mode: form.event_mode,
        custom_title: form.function_name || form.custom_title,
        wedding_date: form.wedding_date,
        venue: form.venue,
        city: form.city,
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
        submitData.custom_title = form.function_name || form.custom_title;
      } else if (form.event_type === 'engagement') {
         submitData.bride_name = form.mother_name;
         submitData.groom_name = form.father_name;
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

      const res = await eventsApi.create(submitData);
      setStep(3);
      if (coverFile) {
        const token = localStorage.getItem('moi_token');
        const fd = new FormData();
        fd.append('event_id', String(res.id));
        fd.append('cover', coverFile);
        await fetch(`${BASE_URL}/events.php?action=cover`, {
          method: 'POST',
          headers: { 'X-Auth-Token': `Bearer ${token}` },
          body: fd,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Done = () => {
    onCreated();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const selectedType = EVENT_TYPES.find(t => t.value === form.event_type);
  const eventTitle = form.event_type === 'custom'
    ? (form.custom_title ? `New ${form.custom_title} Event` : 'New Custom Event')
    : `New ${selectedType?.label || 'Event'}`;
  const eventIcon = selectedType?.icon || 'sparkle';

  // Get appropriate name field labels based on event type
  const getNameFieldLabels = () => {
    if (form.event_type === 'wedding') {
      return { name1: 'Bride Name', name2: 'Groom Name', placeholder1: 'Priya', placeholder2: 'Ravi' };
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
    { num: 2, label: 'Function Details' },
    { num: 3, label: 'Review' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tn-border-alt">
          <div className="flex items-center gap-2.5">
            <span className="text-xl text-tn-gold"><Icon name={eventIcon} size={24} /></span>
            <div>
              <h2 className="font-bold text-tn-text text-base leading-tight">{eventTitle}</h2>
              <p className="text-[11px] text-tn-text-secondary">
                {step === 1 && 'Choose event category'}
                {step === 2 && 'Enter function details'}
                {step === 3 && 'Review & submit'}
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

          {/* ── Step 1: Choose Event Type ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Event Category <span className="text-tn-yellow">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleModeChange('past')}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                      isPast
                        ? 'border-tn-yellow bg-tn-yellow-light text-tn-text'
                        : 'border-tn-border text-tn-text-secondary hover:border-tn-border-alt'
                    }`}
                  >
                    <span className="text-lg text-tn-gold"><Icon name="calendar" size={20} /></span>
                    <span className="text-sm font-bold">Past Event</span>
                    <span className="text-[10px] text-tn-text-secondary leading-relaxed">நடந்த நிகழ்வு · Record keeping only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('new')}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                      !isPast
                        ? 'border-tn-yellow bg-tn-yellow-light text-tn-text'
                        : 'border-tn-border text-tn-text-secondary hover:border-tn-border-alt'
                    }`}
                  >
                    <span className="text-lg text-tn-gold"><Icon name="plus" size={20} /></span>
                    <span className="text-sm font-bold">New Event</span>
                    <span className="text-[10px] text-tn-text-secondary leading-relaxed">இனி நடக்கப்போகிறது · QR & guest payments</span>
                  </button>
                </div>
                <p className="text-[10px] text-tn-yellow mt-2 font-medium">You can&apos;t change this later.</p>
                {!isPast && (
                  <p className="text-[10px] text-tn-text-secondary mt-1.5">New events require admin approval before moi collection begins.</p>
                )}
              </div>

              {/* Event Type Selector */}
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
                <button type="button" onClick={handleStep1Continue} className="flex-1 bg-tn-yellow text-black py-2.5 rounded-lg text-sm font-bold hover:bg-tn-gold transition-colors">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Function Details ── */}
           {step === 2 && (
             <form onSubmit={handleStep2Submit} className="space-y-4">
               {/* Function Name */}
               <div>
                 <div className="flex items-center justify-between mb-1.5">
                   <label className={lbl}>Function Name <span className="text-tn-yellow">*</span></label>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       checked={functionNameManualEdit}
                       onChange={(e) => setFunctionNameManualEdit(e.target.checked)}
                       className="sr-only"
                     />
                     <span className={`text-[10px] mr-1.5 ${functionNameManualEdit ? 'text-tn-yellow' : 'text-tn-text-secondary'}`}>
                       Manual Edit
                     </span>
                     <span className={`inline-block h-4 w-7 rounded-full transition-colors ${
                       functionNameManualEdit ? 'bg-tn-yellow' : 'bg-tn-border'
                     }`}>
                       <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                         functionNameManualEdit ? 'translate-x-3' : ''
                       }`} />
                     </span>
                   </label>
                 </div>
                 <input
                   required
                   value={form.function_name}
                   onChange={(e) => setForm({ ...form, function_name: e.target.value })}
                   className={inp}
                   placeholder={
                     form.event_type === 'wedding' ? 'Arun & Priya Wedding' :
                     form.event_type === 'birthday' ? 'Birthday Celebration' :
                     form.event_type === 'custom' ? 'e.g., Anniversary' :
                     form.event_type === 'engagement' ? 'Mother & Father Engagement' :
                     form.event_type === 'valakaappu' ? 'Mother & Father Name' :
                     form.event_type === 'housewarming' ? 'Host & Spouse Name' :
                     form.event_type === 'graduation' ? 'Graduate Name' :
                     ''
                   }
                   disabled={!functionNameManualEdit}
                   readOnly={!functionNameManualEdit}
                 />
                 <p className="text-[10px] text-tn-text-secondary mt-1">
                   {functionNameManualEdit 
                     ? 'Edit function name manually. It will not sync with partner names.'
                     : 'This name will be shown to guests. It syncs with the details you enter below.'}
                 </p>
               </div>

              {/* Name fields for specific event types */}
                {(form.event_type === 'wedding' || form.event_type === 'valakaappu') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{nameLabels.name1} <span className="text-tn-yellow">*</span></label>
                      <input required value={form.bride_name} onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => {
                          if (functionNameManualEdit) {
                            return { ...prev, bride_name: val };
                          }
                          const fn = `${val} & ${prev.groom_name} ${prev.event_type === 'wedding' ? 'Wedding' : 'Valakaappu'}`;
                          return { ...prev, bride_name: val, function_name: fn };
                        });
                      }} className={inp} placeholder={nameLabels.placeholder1} />
                    </div>
                    <div>
                      <label className={lbl}>{nameLabels.name2} <span className="text-tn-yellow">*</span></label>
                      <input required value={form.groom_name} onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => {
                          if (functionNameManualEdit) {
                            return { ...prev, groom_name: val };
                          }
                          const fn = `${prev.bride_name} & ${val} ${prev.event_type === 'wedding' ? 'Wedding' : 'Valakaappu'}`;
                          return { ...prev, groom_name: val, function_name: fn };
                        });
                      }} className={inp} placeholder={nameLabels.placeholder2} />
                    </div>
                  </div>
                )}

              {form.event_type === 'birthday' && (
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className={lbl}>Person Name <span className="text-tn-yellow">*</span></label>
                     <input required value={form.birthday_person_name} onChange={(e) => {
                       const val = e.target.value;
                       setForm((prev) => {
                         if (functionNameManualEdit) {
                           return { ...prev, birthday_person_name: val };
                         }
                         return { ...prev, birthday_person_name: val, function_name: `${val}'s Birthday Celebration` };
                       });
                     }} className={inp} placeholder="Arun" />
                   </div>
                   <div>
                     <label className={lbl}>Age</label>
                     <input type="number" min="1" max="120" value={form.birthday_person_age} onChange={(e) => setForm({ ...form, birthday_person_age: e.target.value })} className={inp} placeholder="25" />
                   </div>
                 </div>
               )}

              {form.event_type === 'engagement' && (
                 <div className="space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className={lbl}>Parent 1 Name <span className="text-tn-yellow">*</span></label>
                       <input required value={form.parent1_name} onChange={(e) => setForm({ ...form, parent1_name: e.target.value })} className={inp} placeholder="Parent 1" />
                     </div>
                     <div>
                       <label className={lbl}>Parent 2 Name <span className="text-tn-yellow">*</span></label>
                       <input required value={form.parent2_name} onChange={(e) => setForm({ ...form, parent2_name: e.target.value })} className={inp} placeholder="Parent 2" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className={lbl}>Mother Name <span className="text-tn-yellow">*</span></label>
                       <input required value={form.mother_name} onChange={(e) => {
                         const val = e.target.value;
                         setForm((prev) => {
                           if (functionNameManualEdit) {
                             return { ...prev, mother_name: val };
                           }
                           const fn = `${val} & ${prev.father_name} Engagement`;
                           return { ...prev, mother_name: val, function_name: fn };
                         });
                       }} className={inp} placeholder="Lakshmi" />
                     </div>
                     <div>
                       <label className={lbl}>Father Name <span className="text-tn-yellow">*</span></label>
                       <input required value={form.father_name} onChange={(e) => {
                         const val = e.target.value;
                         setForm((prev) => {
                           if (functionNameManualEdit) {
                             return { ...prev, father_name: val };
                           }
                           const fn = `${prev.mother_name} & ${val} Engagement`;
                           return { ...prev, father_name: val, function_name: fn };
                         });
                       }} className={inp} placeholder="Ravi" />
                     </div>
                   </div>
                 </div>
               )}

              {form.event_type === 'housewarming' && (
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className={lbl}>Host Name <span className="text-tn-yellow">*</span></label>
                     <input required value={form.host_name} onChange={(e) => {
                       const val = e.target.value;
                       setForm((prev) => {
                         if (functionNameManualEdit) {
                           return { ...prev, host_name: val };
                         }
                         const fn = `${val}${prev.spouse_name ? ' & ' + prev.spouse_name : ''} Housewarming`;
                         return { ...prev, host_name: val, function_name: fn };
                       });
                     }} className={inp} placeholder="Arun" />
                   </div>
                   <div>
                     <label className={lbl}>Spouse Name <span className="text-tn-yellow">*</span></label>
                     <input required value={form.spouse_name} onChange={(e) => {
                       const val = e.target.value;
                       setForm((prev) => {
                         if (functionNameManualEdit) {
                           return { ...prev, spouse_name: val };
                         }
                         const fn = `${prev.host_name}${val ? ' & ' + val : ''} Housewarming`;
                         return { ...prev, spouse_name: val, function_name: fn };
                       });
                     }} className={inp} placeholder="Priya" />
                   </div>
                 </div>
               )}

               {form.event_type === 'graduation' && (
                 <div>
                   <label className={lbl}>Graduate Name <span className="text-tn-yellow">*</span></label>
                   <input required value={form.graduate_name} onChange={(e) => {
                     const val = e.target.value;
                     setForm((prev) => {
                       if (functionNameManualEdit) {
                         return { ...prev, graduate_name: val };
                       }
                       return { ...prev, graduate_name: val, function_name: `${val}'s Graduation` };
                     });
                   }} className={inp} placeholder="Arun" />
                 </div>
               )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>
                    Date <span className="text-tn-yellow">*</span>
                    <span className="font-normal text-tn-text-secondary ml-1">
                      {isPast ? '(past dates only)' : '(today or upcoming)'}
                    </span>
                  </label>
                  <input
                    required
                    type="date"
                    value={form.wedding_date}
                    max={isPast ? todayStr : undefined}
                    min={!isPast ? todayStr : undefined}
                    onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Time</label>
                  <input
                    type="time"
                    value={form.wedding_date ? '10:00' : ''}
                    onChange={() => {}}
                    className={inp}
                    placeholder="Select time"
                  />
                </div>
              </div>

              {/* Venue & City */}
              <div>
                <label className={lbl}>Venue</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inp} placeholder="Sri Murugan Mahal, Chennai" />
              </div>
              <div>
                <label className={lbl}>City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} placeholder="Chennai" />
              </div>

              {/* Description */}
              <div>
                <label className={lbl}>Description (Optional)</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} resize-none`} placeholder="A brief note about the event…" />
                <p className="text-[10px] text-tn-text-secondary mt-1">ℹ️ These details will be shown to guests on the invitation page.</p>
              </div>

              {/* Cover Photo */}
              <div>
                <label className={lbl}>Cover Photo</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${coverPreview ? 'border-[#FFC107]' : 'border-tn-border hover:border-[#FFC107]'}`}
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
                  {loading ? 'Submitting…' : 'Submit for Approval →'}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Pending Approval ── */}
          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-16 h-16 bg-tn-yellow-light border-2 border-[#FFC107] rounded-full flex items-center justify-center text-3xl">
                ⏳
              </div>
              <div>
                <h3 className="text-lg font-bold text-tn-text mb-1">Your Function is Submitted!</h3>
                <p className="text-xs text-tn-text-secondary leading-relaxed">
                  Your function has been submitted for admin approval.<br />
                  You will be notified once it is approved.
                </p>
              </div>
              <div className="bg-tn-yellow-light border border-tn-yellow-border rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-bold text-tn-yellow-text uppercase tracking-wider">Status</span>
                  <span className="text-[10px] font-bold bg-tn-yellow text-black px-2 py-0.5 rounded-full">Pending Approval</span>
                </div>
                <p className="text-[10px] text-tn-text-secondary">
                  Review in progress · Event not yet active · Waiting for administrator verification
                </p>
              </div>
              <button type="button" onClick={handleStep3Done} className="w-full bg-tn-yellow text-black py-2.5 rounded-lg text-sm font-bold hover:bg-tn-gold transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

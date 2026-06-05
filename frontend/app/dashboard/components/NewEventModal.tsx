'use client';

import { useState, useRef } from 'react';
import { eventsApi } from '@/lib/api';

interface NewEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type EventType = 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'custom';

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding', icon: '💒' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'engagement', label: 'Engagement', icon: '💍' },
  { value: 'valakaappu', label: 'Valakaappu', icon: '🌺' },
  { value: 'housewarming', label: 'Housewarming', icon: '🏠' },
  { value: 'custom', label: 'Custom', icon: '🎉' },
];

export default function NewEventModal({ onClose, onCreated }: NewEventModalProps) {
  const [form, setForm] = useState({
    event_type: 'wedding' as EventType,
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
    wedding_date: '',
    venue: '',
    venue_latitude: '',
    venue_longitude: '',
    description: '',
  });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inp = 'w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors bg-white';
  const lbl = 'block text-xs font-semibold text-[#555] mb-1.5';

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const submitData: Record<string, unknown> = {
        event_type: form.event_type,
        wedding_date: form.wedding_date,
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
      }

      const res = await eventsApi.create(submitData);
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
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const selectedType = EVENT_TYPES.find(t => t.value === form.event_type);
  const eventTitle = form.event_type === 'custom' 
    ? (form.custom_title ? `New ${form.custom_title} Event` : 'New Custom Event')
    : `New ${selectedType?.label || 'Event'}`;
  const eventIcon = selectedType?.icon || '🎉';
  const eventSubtitle = form.event_type === 'wedding' 
    ? 'புதிய திருமண நிகழ்வு' 
    : form.event_type === 'birthday' 
    ? 'புதிய பிறந்தநாள் நிகழ்வு'
    : form.event_type === 'engagement'
    ? 'புதிய நிஶ்சலயத்தார்ந்து'
    : form.event_type === 'valakaappu'
    ? 'புதிய வலக்காப்பு'
    : form.event_type === 'housewarming'
    ? 'புதிய வீட்டு பண்டிகை'
    : 'புதிய நிகழ்வு';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{eventIcon}</span>
            <div>
              <h2 className="font-bold text-[#101010] text-base leading-tight">{eventTitle}</h2>
              <p className="text-[11px] text-[#999]">{eventSubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-[#999] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors text-lg">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

          {/* Event Type Selector */}
          <div>
            <label className={lbl}>Event Type <span className="text-[#FFC107]">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, event_type: type.value })}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border-2 font-semibold text-xs transition-all ${
                    form.event_type === type.value
                      ? 'border-[#FFC107] bg-[#FFFCF5] text-[#101010]'
                      : 'border-[#E8E8E8] text-[#666] hover:border-[#ccc]'
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Title - only for custom events */}
          {form.event_type === 'custom' && (
            <div>
              <label className={lbl}>Event Title <span className="text-[#FFC107]">*</span></label>
              <input 
                required 
                value={form.custom_title} 
                onChange={(e) => setForm({ ...form, custom_title: e.target.value })} 
                className={inp} 
                placeholder="e.g., Anniversary, Naming Ceremony" 
              />
            </div>
          )}

          {/* Cover photo */}
          <div>
            <label className={lbl}>Cover Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${coverPreview ? 'border-[#FFC107]' : 'border-[#E8E8E8] hover:border-[#FFC107]'}`}
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
                <div className="h-24 flex flex-col items-center justify-center gap-1.5 text-[#bbb]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <p className="text-xs font-medium">Click to upload cover photo</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.event_type === 'wedding' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Bride Name <span className="text-[#FFC107]">*</span></label>
                  <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
                </div>
                <div>
                  <label className={lbl}>Groom Name <span className="text-[#FFC107]">*</span></label>
                  <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
                </div>
              </div>
            ) : form.event_type === 'birthday' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Person Name <span className="text-[#FFC107]">*</span></label>
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
                    <label className={lbl}>Partner 1 Name <span className="text-[#FFC107]">*</span></label>
                    <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
                  </div>
                  <div>
                    <label className={lbl}>Partner 2 Name <span className="text-[#FFC107]">*</span></label>
                    <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Mother Name <span className="text-[#FFC107]">*</span></label>
                    <input required value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} className={inp} placeholder="Lakshmi" />
                  </div>
                  <div>
                    <label className={lbl}>Father Name <span className="text-[#FFC107]">*</span></label>
                    <input required value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className={inp} placeholder="Ravi" />
                  </div>
                </div>
              </div>
            ) : form.event_type === 'valakaappu' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>{nameLabels.name1} <span className="text-[#FFC107]">*</span></label>
                  <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder={nameLabels.placeholder1} />
                </div>
                <div>
                  <label className={lbl}>{nameLabels.name2} <span className="text-[#FFC107]">*</span></label>
                  <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder={nameLabels.placeholder2} />
                </div>
              </div>
            ) : form.event_type === 'housewarming' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Host Name <span className="text-[#FFC107]">*</span></label>
                  <input required value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} className={inp} placeholder="Arun" />
                </div>
                <div>
                  <label className={lbl}>Spouse Name <span className="text-[#FFC107]">*</span></label>
                  <input required value={form.spouse_name} onChange={(e) => setForm({ ...form, spouse_name: e.target.value })} className={inp} placeholder="Priya" />
                </div>
              </div>
            ) : null}
            <div>
              <label className={lbl}>Event Date <span className="text-[#FFC107]">*</span></label>
              <input required type="date" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} className={inp} />
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
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-[#E8E8E8] text-[#666] py-2.5 rounded-lg text-sm font-semibold hover:border-[#ccc] transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#FFC107] text-black py-2.5 rounded-lg text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
                {loading ? 'Creating…' : 'Create Event →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
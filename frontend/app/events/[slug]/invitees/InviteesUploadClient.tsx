
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, Event, showSuccess } from '@/lib/api';
import MobileHeader from '@/components/MobileHeader';
import { useSlug } from '@/lib/useSlug';

export default function InviteesUploadScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/invitees → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{ valid: number; invalid: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      try {
        const data = await eventsApi.get(slug);
        setEvent(data);
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSummary(null);

    // Simulate upload processing
    setTimeout(() => {
      setUploadSummary({
        valid: 100,
        invalid: 5,
        errors: [
          'Row 3: Missing name',
          'Row 7: Invalid phone number',
          'Row 12: Duplicate entry',
          'Row 15: Missing relationship',
          'Row 23: Invalid phone format',
        ],
      });
      setUploading(false);
    }, 1500);
  };

  const handleSaveInvitees = () => {
    showSuccess('Invitees saved successfully');
    router.push(`/events/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
          <p className="text-tn-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-tn-subtle">Event not found</p>
      </div>
    );
  }

  const eventDate = event.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-tn-yellow/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-tn-purple-bg/40 blur-3xl" />
      </div>

      <MobileHeader
        title="Invitees Upload"
        rightAction={{
          label: 'Save',
          onClick: handleSaveInvitees,
        }}
      />

      <div className="flex-1 flex flex-col px-6 pt-6 relative z-10">
        {/* Event Summary */}
        <div className="bg-tn-light border border-tn-border rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-bold text-tn-text">{event.custom_title || event.event_type}</h3>
          <p className="text-xs text-tn-muted mt-1">{eventDate} · {event.venue || event.city || '—'}</p>
        </div>

        {/* Upload Guest List */}
        <div className="bg-white border border-tn-border rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-tn-text mb-2">Upload Guest List</h3>
          <p className="text-xs text-tn-muted mb-4">Supported formats: Excel (.xlsx), CSV</p>

          {/* Download Sample Template */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              className="flex-1 py-2.5 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted hover:bg-tn-light transition-colors"
            >
              Excel
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted hover:bg-tn-light transition-colors"
            >
              CSV
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-tn-border rounded-2xl p-8 text-center cursor-pointer hover:border-tn-yellow transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
                <p className="text-sm text-tn-muted">Uploading...</p>
              </div>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-tn-subtle mb-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-sm font-semibold text-tn-text mb-1">Drag & Drop</p>
                <p className="text-xs text-tn-muted">or click to upload Excel file</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Upload Summary */}
        {uploadSummary && (
          <div className="bg-white border border-tn-border rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-tn-text mb-4">Upload Summary</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-tn-green-bg border border-tn-success/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-tn-success">{uploadSummary.valid}</p>
                <p className="text-[10px] text-tn-muted">Valid Records</p>
              </div>
              <div className="bg-tn-error/10 border border-tn-error/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-tn-error">{uploadSummary.invalid}</p>
                <p className="text-[10px] text-tn-muted">Invalid Records</p>
              </div>
            </div>

            {uploadSummary.errors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-tn-error mb-2">Error Report</h4>
                <div className="space-y-1">
                  {uploadSummary.errors.map((error, index) => (
                    <p key={index} className="text-xs text-tn-muted">• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invitation Options */}
        <div className="bg-white border border-tn-border rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-tn-text mb-4">Invitation Options</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: 'arrow-right' as IconName, label: 'WhatsApp' },
              { icon: 'list' as IconName, label: 'SMS' },
              { icon: 'list' as IconName, label: 'Email' },
              { icon: 'download' as IconName, label: 'QR Link' },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-tn-light transition-colors"
              >
                <div className="w-12 h-12 bg-tn-purple-bg rounded-full flex items-center justify-center text-xl text-tn-gold">
                  <Icon name={option.icon} size={24} />
                </div>
                <span className="text-[10px] font-medium text-tn-muted text-center leading-tight">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSaveInvitees}
            disabled={!uploadSummary}
            className="w-full h-[52px] bg-tn-yellow text-white rounded-xl font-semibold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-tn-yellow/20"
          >
            Save Invitees
          </button>
          <button
            type="button"
            onClick={() => router.push(`/events/${slug}/qr`)}
            className="w-full h-[52px] border border-tn-border rounded-xl font-semibold text-base text-tn-muted hover:bg-tn-light transition-colors"
          >
            Generate Invitation Link
          </button>
        </div>
      </div>
    </div>
  );
}

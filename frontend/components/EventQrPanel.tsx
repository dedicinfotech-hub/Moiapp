'use client';

import { useEffect, useState, useCallback } from 'react';
import { Event, eventsApi, showSuccess } from '@/lib/api';
import { getPublicEventUrl, getQrImageUrl, downloadQrPng } from '@/lib/guestUrl';
import { getEventDisplayName } from '@/lib/eventHelpers';
import ConfirmModal from '@/components/ConfirmModal';

interface EventQrPanelProps {
  event: Event;
  onUpdate?: (patch: Partial<Event>) => void;
}

export default function EventQrPanel({ event, onUpdate }: EventQrPanelProps) {
  const [qrCount, setQrCount] = useState(Number(event.qr_payment_count ?? event.stats?.qr_payment_count ?? 0));
  const [qrEnabled, setQrEnabled] = useState(event.qr_enabled !== 0);
  const [loading, setLoading] = useState(false);
  const [confirmToggleQr, setConfirmToggleQr] = useState(false);
  const [confirmRegenerateQr, setConfirmRegenerateQr] = useState(false);

  const guestShareUrl = event.slug ? getPublicEventUrl(event.slug) : '';
  const qrImg = guestShareUrl ? getQrImageUrl(guestShareUrl, 280) : '';
  const eventLabel = getEventDisplayName(event);

  const refreshStats = useCallback(async () => {
    if (!event.slug) return;
    try {
      const ev = await eventsApi.get(event.slug);
      const count = Number(ev.stats?.qr_payment_count ?? ev.qr_payment_count ?? 0);
      setQrCount(count);
      setQrEnabled(ev.qr_enabled !== 0);
      onUpdate?.({ qr_payment_count: count, qr_enabled: ev.qr_enabled });
    } catch {
      // ignore poll errors
    }
  }, [event.slug, onUpdate]);

  useEffect(() => {
    if (!event.guest_token || !qrEnabled) return;
    const t = setInterval(refreshStats, 15000);
    return () => clearInterval(t);
  }, [event.guest_token, qrEnabled, refreshStats]);

  if (!event.guest_token || event.event_mode !== 'new' || event.approval_status !== 'approved') {
    return null;
  }

  const handleToggleQr = async () => {
    setConfirmToggleQr(true);
  };

  const confirmToggleQrAction = async () => {
    setConfirmToggleQr(false);
    setLoading(true);
    try {
      const res = await eventsApi.setQrEnabled(event.id, !qrEnabled);
      setQrEnabled(!!res.qr_enabled);
      showSuccess(res.qr_enabled ? 'Guest Give Moi enabled' : 'Guest Give Moi closed');
      onUpdate?.({ qr_enabled: res.qr_enabled ? 1 : 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    setConfirmRegenerateQr(true);
  };

  const confirmRegenerateQrAction = async () => {
    setConfirmRegenerateQr(false);
    setLoading(true);
    try {
      const res = await eventsApi.regenerateQr(event.id);
      showSuccess('Guest access token regenerated');
      onUpdate?.({ guest_token: res.guest_token });
    } catch {
      // error handled by api.ts toast
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    const text = `${eventLabel} — View event & Give Moi (no app needed):\n${guestShareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white border border-tn-border rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-tn-text text-sm">Share with guests</h3>
          <p className="text-xs text-tn-muted mt-0.5">Public event page with Give Moi · print QR on invitations</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-tn-muted">Guest payments:</span>
          <span className="font-bold text-tn-text">{qrCount}</span>
          <button type="button" onClick={refreshStats} className="text-[10px] text-tn-yellow font-semibold hover:underline">
            Refresh
          </button>
        </div>
      </div>

      {!qrEnabled ? (
        <div className="bg-tn-light border border-tn-border rounded-lg px-4 py-3 text-sm text-tn-muted">
          Guest Give Moi is closed. Re-enable when you want guests to contribute again.
          <button
            type="button"
            onClick={handleToggleQr}
            disabled={loading}
            className="block mt-2 text-xs font-bold text-tn-gold hover:underline disabled:opacity-50"
          >
            Re-enable Give Moi
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
          <div className="shrink-0 flex justify-center bg-white p-3 border-2 border-tn-text rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImg} alt="Public event page QR code" width={180} height={180} className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]" />
          </div>
          <div className="flex-1 space-y-3 w-full">
            <div>
              <p className="text-[10px] font-semibold text-tn-muted uppercase tracking-wide mb-1">Public event page</p>
              <p className="text-[10px] text-tn-subtle break-all font-mono">{guestShareUrl}</p>
              <p className="text-[10px] text-tn-muted mt-2">Guests see event details, photos, and the Give Moi button.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => downloadQrPng(guestShareUrl, `moi-event-${event.slug}.png`)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-tn-yellow text-black hover:bg-tn-yellow-2 text-center"
              >
                ⬇ Download PNG
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-tn-success text-tn-success hover:bg-tn-success-bg text-center"
              >
                WhatsApp Share
              </button>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(guestShareUrl); showSuccess('Public page link copied'); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-tn-border text-tn-muted hover:border-tn-yellow text-center"
              >
                Copy Link
              </button>
              <a
                href={guestShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-tn-purple/30 text-tn-purple-text hover:bg-tn-purple-bg text-center"
              >
                Open Page
              </a>
              <button
                type="button"
                onClick={handleToggleQr}
                disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-tn-error/20 text-tn-error hover:bg-tn-error-bg disabled:opacity-50 text-center"
              >
                Close Give Moi
              </button>
              <button
                type="button"
                onClick={handleRegenerateQr}
                disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-tn-border text-tn-muted hover:border-tn-yellow disabled:opacity-50 text-center"
              >
                🔄 Regenerate token
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmToggleQr}
        title={qrEnabled ? 'Close Guest Give Moi' : 'Re-enable Guest Give Moi'}
        message={qrEnabled ? 'Guests will not be able to give moi from the public page. Are you sure?' : 'Re-enable Give Moi on the public event page?'}
        confirmText={qrEnabled ? 'Close' : 'Enable'}
        variant="warning"
        onConfirm={confirmToggleQrAction}
        onCancel={() => setConfirmToggleQr(false)}
      />

      <ConfirmModal
        isOpen={confirmRegenerateQr}
        title="Regenerate guest token"
        message="Legacy guest-token links will stop working. The public event page link stays the same."
        confirmText="Regenerate"
        variant="danger"
        onConfirm={confirmRegenerateQrAction}
        onCancel={() => setConfirmRegenerateQr(false)}
      />
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Event, eventsApi, showSuccess } from '@/lib/api';
import { getGuestPaymentUrl, getQrImageUrl, downloadQrPng } from '@/lib/guestUrl';
import { getEventDisplayName } from '@/lib/eventHelpers';

interface EventQrPanelProps {
  event: Event;
  onUpdate?: (patch: Partial<Event>) => void;
}

export default function EventQrPanel({ event, onUpdate }: EventQrPanelProps) {
  const [qrCount, setQrCount] = useState(Number(event.qr_payment_count ?? event.stats?.qr_payment_count ?? 0));
  const [qrEnabled, setQrEnabled] = useState(event.qr_enabled !== 0);
  const [loading, setLoading] = useState(false);

  const token = event.guest_token;
  const paymentUrl = token ? getGuestPaymentUrl(token) : '';
  const qrImg = paymentUrl ? getQrImageUrl(paymentUrl, 280) : '';
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
    if (!token || !qrEnabled) return;
    const t = setInterval(refreshStats, 15000);
    return () => clearInterval(t);
  }, [token, qrEnabled, refreshStats]);

  if (!token || event.event_mode !== 'new' || event.approval_status !== 'approved') {
    return null;
  }

  const handleToggleQr = async () => {
    if (!confirm(qrEnabled ? 'Close guest QR payments? Guests will not be able to scan and pay.' : 'Re-enable guest QR payments?')) return;
    setLoading(true);
    try {
      const res = await eventsApi.setQrEnabled(event.id, !qrEnabled);
      setQrEnabled(!!res.qr_enabled);
      showSuccess(res.qr_enabled ? 'QR payments enabled' : 'QR payments closed');
      onUpdate?.({ qr_enabled: res.qr_enabled ? 1 : 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!confirm('Regenerate QR code? The old QR code and link will stop working immediately.')) return;
    setLoading(true);
    try {
      const res = await eventsApi.regenerateQr(event.id);
      showSuccess('QR code regenerated — old link is now deactivated');
      onUpdate?.({ guest_token: res.guest_token });
    } catch {
      // error handled by api.ts toast
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    const text = `${eventLabel} — Give Moi via QR (no app needed):\n${paymentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#101010] text-sm">Guest QR Code</h3>
          <p className="text-xs text-[#666] mt-0.5">Print on invitation · guests scan & pay — no app download</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#666]">QR payments:</span>
          <span className="font-bold text-[#101010]">{qrCount}</span>
          <button type="button" onClick={refreshStats} className="text-[10px] text-[#FFC107] font-semibold hover:underline">
            Refresh
          </button>
        </div>
      </div>

      {!qrEnabled ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
          Guest QR is closed. Re-enable when you want guests to pay again.
          <button
            type="button"
            onClick={handleToggleQr}
            disabled={loading}
            className="block mt-2 text-xs font-bold text-[#B8860B] hover:underline disabled:opacity-50"
          >
            Re-enable QR
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
          <div className="shrink-0 bg-white p-3 border-2 border-[#101010] rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImg} alt="Event payment QR code" width={200} height={200} className="w-[200px] h-[200px]" />
          </div>
          <div className="flex-1 space-y-2 w-full">
            <p className="text-[10px] text-[#999] break-all font-mono">{paymentUrl}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadQrPng(paymentUrl, `moi-qr-${event.slug}.png`)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#FFC107] text-black hover:bg-[#E6AC00]"
              >
                ⬇ Download PNG
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-[#25D366] text-[#128C7E] hover:bg-green-50"
              >
                WhatsApp Share
              </button>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(paymentUrl); showSuccess('Link copied'); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-[#E8E8E8] text-[#666] hover:border-[#FFC107]"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleToggleQr}
                disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Close Function QR
              </button>
              <button
                type="button"
                onClick={handleRegenerateQr}
                disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-[#E8E8E8] text-[#666] hover:border-[#FFC107] disabled:opacity-50"
              >
                🔄 Regenerate QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

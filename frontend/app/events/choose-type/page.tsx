'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreateFlowHeader } from '@/components/event/EventLayout';

type EventCategory = 'new' | 'past';

function CheckItem({ text, color }: { text: string; color: 'purple' | 'blue' }) {
  const iconColor = color === 'purple' ? 'text-tn-purple-text' : 'text-tn-blue-soft';
  const textColor = color === 'purple' ? 'text-tn-purple' : 'text-tn-blue-soft';
  return (
    <div className="flex items-center gap-2">
      <svg className={iconColor} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span className={`text-xs ${textColor}`}>{text}</span>
    </div>
  );
}

function RadioDot({ selected, color }: { selected: boolean; color: 'purple' | 'blue' }) {
  const border = color === 'purple' ? 'border-tn-purple-text' : 'border-tn-blue-soft';
  const fill = color === 'purple' ? 'bg-tn-purple-text' : 'bg-tn-blue-soft';
  return (
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? `${border} ${fill}` : 'border-tn-border bg-white'}`}>
      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
    </div>
  );
}

export default function ChooseEventTypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<EventCategory | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/events/create?mode=${selected}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20 lg:pb-0">
      <CreateFlowHeader title="Choose Event Type" onBack={() => router.push('/dashboard')} showHelp={false} />

      <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
        <p className="text-sm text-tn-text-secondary text-center mb-6">This will set the flow for your function</p>

        <div className="space-y-4 mb-6">
          {/* New Event */}
          <button
            type="button"
            onClick={() => setSelected('new')}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
              selected === 'new' ? 'border-tn-purple-text bg-tn-purple-bg' : 'border-tn-border-alt bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-tn-purple-bg flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-purple-text">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M12 14l-1 1.5h2L12 14z" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-tn-purple mb-0.5">New Event</h3>
                <p className="text-xs text-tn-purple-text mb-2">இனி நடக்கப்போகிறது</p>
                <div className="space-y-1">
                  <CheckItem text="Live moi collection" color="purple" />
                  <CheckItem text="QR code will be generated" color="purple" />
                </div>
              </div>
              <RadioDot selected={selected === 'new'} color="purple" />
            </div>
          </button>

          {/* Past Event */}
          <button
            type="button"
            onClick={() => setSelected('past')}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
              selected === 'past' ? 'border-tn-blue-soft bg-tn-blue-bg' : 'border-tn-border-alt bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-tn-blue-bg flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-blue-soft">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
                  <circle cx="12" cy="14" r="3"/><polyline points="12 11 12 14 14 15"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-tn-blue-soft mb-0.5">Past Event</h3>
                <p className="text-xs text-tn-blue-soft mb-2">ஏற்கனவே நடந்தது</p>
                <div className="space-y-1">
                  <CheckItem text="Record keeping only" color="blue" />
                  <CheckItem text="No QR code" color="blue" />
                </div>
              </div>
              <RadioDot selected={selected === 'past'} color="blue" />
            </div>
          </button>
        </div>

        <div className="bg-tn-purple-bg rounded-xl p-4 mb-auto flex items-start gap-3">
          <svg className="shrink-0 mt-0.5 text-tn-purple-text" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-tn-purple">You can&apos;t change this later</p>
            <p className="text-xs text-tn-text-secondary mt-0.5">Choose carefully, this will set the flow for your entire event.</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected}
            className="w-full h-[52px] bg-tn-purple text-white rounded-xl font-semibold text-base hover:bg-tn-purple-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Continue
          </button>
          <Link href="/dashboard" className="block w-full text-center text-sm font-semibold text-tn-purple py-2">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';

interface GuestFlowHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  badge?: string;
}

export default function GuestFlowHeader({ title, subtitle, backHref, badge }: GuestFlowHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-tn-border px-4 pt-3 pb-3">
      <div className="flex items-center justify-between mb-1">
        {backHref ? (
          <Link href={backHref} className="w-10 h-10 flex items-center justify-center text-tn-purple" aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
        ) : <div className="w-10" />}
        <h1 className="text-base font-bold text-tn-text">{title}</h1>
        {badge ? (
          <span className="text-[10px] font-semibold text-tn-success flex items-center gap-1 bg-tn-success-bg px-2 py-1 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {badge}
          </span>
        ) : (
          <button type="button" className="w-10 h-10 flex items-center justify-center text-tn-purple" aria-label="Help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
        )}
      </div>
      {subtitle && <p className="text-xs text-tn-muted text-center">{subtitle}</p>}
    </header>
  );
}

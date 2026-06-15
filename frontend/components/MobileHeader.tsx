'use client';

import { useState } from 'react';
import Link from 'next/link';
import MobileDrawer from './MobileDrawer';

interface MobileHeaderProps {
  title: string;
  rightAction?: {
    label: string;
    onClick: () => void;
  };
  rightHref?: string;
}

export default function MobileHeader({ title, rightAction, rightHref }: MobileHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className="sticky top-0 z-30 h-[60px] bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] rounded-b-[16px] shadow-lg flex items-center justify-between px-4 safe-area-top">
        {/* Left: Hamburger Menu */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-white"
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Center: Title */}
        <h1 className="text-[18px] font-semibold text-white text-center flex-1 px-2 truncate">
          {title}
        </h1>

        {/* Right: Action Icon */}
        {rightAction ? (
          <button
            onClick={rightAction.onClick}
            className="w-10 h-10 flex items-center justify-center text-white"
            aria-label={rightAction.label}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ) : rightHref ? (
          <Link href={rightHref} className="w-10 h-10 flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </header>
    </>
  );
}

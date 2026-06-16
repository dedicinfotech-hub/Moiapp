'use client';

import { useState } from 'react';
import Link from 'next/link';
import MobileDrawer from './MobileDrawer';
import Icon, { type IconName } from '@/components/ui/Icon';

export type MobileHeaderVariant = 'light' | 'gradient' | 'purple';

interface MobileHeaderProps {
  title: string;
  variant?: MobileHeaderVariant;
  leftAction?: React.ReactNode;
  rightAction?: {
    label: string;
    icon?: IconName;
    onClick: () => void;
  };
  rightHref?: string;
  rightIcon?: IconName;
  onBack?: () => void;
  showMenu?: boolean;
}

export default function MobileHeader({ 
  title, 
  variant = 'light',
  leftAction,
  rightAction, 
  rightHref,
  rightIcon,
  onBack,
  showMenu = true,
}: MobileHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const variantClasses = {
    light: {
      header: 'bg-white border-b border-tn-border',
      title: 'text-tn-text',
      icon: 'text-tn-text',
      backIcon: 'text-tn-purple',
    },
    gradient: {
      header: 'bg-gradient-to-r from-tn-purple to-tn-purple-2',
      title: 'text-white',
      icon: 'text-white',
      backIcon: 'text-white',
    },
    purple: {
      header: 'bg-tn-purple',
      title: 'text-white',
      icon: 'text-white',
      backIcon: 'text-white',
    },
  };

  const classes = variantClasses[variant];

  return (
    <>
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className={`sticky top-0 z-30 h-14 rounded-b-[16px] shadow-lg flex items-center justify-between px-4 safe-area-top ${classes.header}`}>
        {/* Left: Back button or Hamburger Menu */}
        <div className="flex items-center">
          {leftAction}
          {onBack && !leftAction && (
            <button
              type="button"
              onClick={onBack}
              className={`w-10 h-10 flex items-center justify-center ${classes.backIcon}`}
              aria-label="Go back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          {showMenu && !onBack && !leftAction && (
            <button
              onClick={() => setDrawerOpen(true)}
              className={`w-10 h-10 flex items-center justify-center ${classes.icon}`}
              aria-label="Open menu"
            >
              <Icon name="menu" size={22} />
            </button>
          )}
        </div>

        {/* Center: Title */}
        <h1 className={`text-base font-bold ${classes.title} text-center flex-1 px-2 truncate`}>
          {title}
        </h1>

        {/* Right: Action Icon */}
        {rightAction ? (
          <button
            onClick={rightAction.onClick}
            className={`w-10 h-10 flex items-center justify-center ${classes.icon}`}
            aria-label={rightAction.label}
          >
            {rightAction.icon ? <Icon name={rightAction.icon} size={20} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>
        ) : rightHref ? (
          <Link href={rightHref} className={`w-10 h-10 flex items-center justify-center ${classes.icon}`}>
            {rightIcon ? <Icon name={rightIcon} size={20} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </header>
    </>
  );
}

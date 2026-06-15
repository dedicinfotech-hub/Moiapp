'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';

export interface AppSidebarItem {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface AppSidebarSection {
  label: string;
  items: AppSidebarItem[];
}

interface AppSidebarProps {
  items?: AppSidebarItem[];
  sections?: AppSidebarSection[];
  user?: { name?: string; email?: string } | null;
  onLogout?: () => void;
  adminBadge?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  fixed?: boolean;
  collapsed?: boolean;
  footer?: ReactNode;
  className?: string;
}

function SidebarContent({
  items = [],
  sections,
  user,
  onLogout,
  onClose,
  footer,
}: Pick<AppSidebarProps, 'items' | 'sections' | 'user' | 'onLogout' | 'adminBadge' | 'onClose' | 'footer'>) {
  const navSections = sections?.length ? sections : [{ label: 'Menu', items }];

  return (
    <>
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-semibold text-tn-muted uppercase tracking-widest px-5 mb-1 mt-4 first:mt-0">
            {section.label}
          </p>
          {section.items.map((item) => {
            const content = (
              <>
                <span className="text-base w-5 text-center text-current">
                  <Icon name={item.icon} size={18} />
                </span>
                <span>{item.label}</span>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={[
                  'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                  item.active
                    ? 'bg-tn-yellow-bg text-tn-text border-r-[3px] border-tn-yellow'
                    : 'text-tn-muted hover:bg-tn-light hover:text-tn-text',
                ].join(' ')}
              >
                {content}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  onClose?.();
                }}
                className={[
                  'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                  item.active
                    ? 'bg-tn-yellow-bg text-tn-text border-r-[3px] border-tn-yellow'
                    : 'text-tn-muted hover:bg-tn-light hover:text-tn-text',
                ].join(' ')}
              >
                {content}
              </button>
            );
          })}
        </div>
      ))}

      <div className="border-t border-tn-border px-4 py-3 shrink-0">
        {footer || (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-tn-yellow flex items-center justify-center text-black font-bold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-tn-text truncate leading-tight">{user?.name || 'MoiApp User'}</p>
              <p className="text-[11px] text-tn-muted truncate">{user?.email || 'Account'}</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out"
                className="text-tn-muted hover:text-red-400 transition-colors shrink-0 p-1"
              >
                <Icon name="lock" size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function AppSidebar({
  items = [],
  sections,
  user,
  onLogout,
  adminBadge,
  isOpen = true,
  onClose,
  fixed = false,
  collapsed = false,
  footer,
  className = '',
}: AppSidebarProps) {
  const widthClass = fixed && collapsed ? 'w-60 lg:w-0 lg:overflow-hidden' : 'w-60';
  const baseClasses = [
    `${widthClass} flex flex-col bg-white border-r border-tn-border shrink-0`,
    className,
  ];

  if (fixed) {
    baseClasses.push(
      'fixed inset-y-0 left-0 z-40 transition-all duration-200 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:relative lg:translate-x-0',
      fixed && collapsed ? 'lg:border-r-0' : ''
    );
  }

  return (
    <aside className={baseClasses.join(' ')}>
      <div className="h-14 flex items-center gap-2 px-5 border-b border-tn-border shrink-0">
        <Link href="/" className="font-extrabold text-lg text-tn-text leading-none">
          Moi<span className="text-tn-yellow">App</span>
        </Link>
        {adminBadge && (
          <span className="text-[9px] font-bold bg-tn-yellow text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <SidebarContent
          items={items}
          sections={sections}
          user={user}
          onLogout={onLogout}
          adminBadge={adminBadge}
          onClose={onClose}
          footer={footer}
        />
      </nav>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { Suspense } from 'react';

export interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  onClick?: () => void;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeTab?: string;
  showLabels?: boolean;
  className?: string;
}

function BottomNavigationContent({
  items,
  activeTab,
  showLabels = true,
  className = '',
}: BottomNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const resolvedActive =
    activeTab ||
    items.find((item) => item.href === currentUrl)?.id;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-tn-border flex items-center justify-around px-1 z-40 safe-area-bottom ${className}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={(e) => {
            if (item.onClick) {
              e.preventDefault();
              item.onClick();
            }
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[72px] ${
            resolvedActive === item.id ? 'text-tn-yellow' : 'text-tn-text-secondary'
          }`}
        >
          <Icon name={item.icon} size={20} />
          {showLabels && (
            <span className={`text-[10px] ${resolvedActive === item.id ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export default function BottomNavigation(props: BottomNavigationProps) {
  return (
    <Suspense fallback={
      <nav className={`fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-tn-border flex items-center justify-around px-1 z-40 safe-area-bottom ${props.className || ''}`}>
        {props.items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[72px] text-tn-text-secondary">
            <Icon name={item.icon} size={20} />
            {props.showLabels && (
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    }>
      <BottomNavigationContent {...props} />
    </Suspense>
  );
}
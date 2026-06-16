'use client';

import Link from 'next/link';
import Icon, { type IconName } from '@/components/ui/Icon';

export interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeTab?: string;
  showLabels?: boolean;
}

export default function BottomNavigation({ 
  items, 
  activeTab,
  showLabels = true,
}: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-tn-border flex items-center justify-around px-1 z-40 safe-area-bottom">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[72px] ${
            activeTab === item.id ? 'text-tn-purple' : 'text-tn-text-secondary'
          }`}
        >
          <Icon name={item.icon} size={20} />
          {showLabels && (
            <span className={`text-[10px] ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Icon, { type IconName } from '@/components/ui/Icon';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: 'dashboard' as IconName },
    { href: '/events', label: 'Functions', icon: 'wedding' as IconName },
    { href: '/events/choose-type', label: 'Create Function', icon: 'plus' as IconName },
    { href: '/dashboard', label: 'Moi List', icon: 'list' as IconName },
    { href: '/dashboard', label: 'Reports', icon: 'chart' as IconName },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-tn-purple to-tn-purple-2 flex items-center justify-between px-4">
          <h2 className="text-white font-bold text-lg">Moi PassBook</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-tn-text hover:bg-tn-light transition-colors"
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        {user && (
          <div className="border-t border-tn-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-tn-purple flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-tn-text truncate">{user.name}</p>
                <p className="text-[11px] text-tn-subtle truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-3 text-sm text-tn-error font-medium hover:bg-tn-error-bg rounded-lg py-2 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

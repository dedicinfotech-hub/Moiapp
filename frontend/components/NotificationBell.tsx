'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { notificationsApi, type Notification } from '@/lib/api';

function notificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('moi_settings');
    if (!raw) return true;
    const settings = JSON.parse(raw);
    if (settings.notificationsEnabled === false) return false;
    return true;
  } catch {
    return true;
  }
}

function isNotificationTypeEnabled(type: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('moi_settings');
    if (!raw) return true;
    const settings = JSON.parse(raw);
    if (settings.notificationsEnabled === false) return false;
    switch (type) {
      case 'reminder':
        return settings.notifFunctionReminder !== false;
      case 'function_date':
        return settings.notifFunctionToday !== false;
      case 'return_gift':
        return settings.notifReturnGift !== false;
      case 'entry_saved':
        return settings.notifEntrySaved !== false;
      default:
        return true;
    }
  } catch {
    return true;
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const seenIdsRef = useRef<Set<number>>(new Set());

  const showBrowserNotification = useCallback((n: Notification) => {
    if (typeof window === 'undefined' || !notificationsEnabled()) return;
    if (!isNotificationTypeEnabled(n.type)) return;
    if (!('Notification' in window) || window.Notification.permission !== 'granted') return;
    try {
      new window.Notification(n.title, {
        body: n.message || undefined,
        icon: '/favicon.ico',
      });
    } catch {
      // ignore
    }
  }, []);

  const loadNotifications = useCallback(async (fromPoll = false) => {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(data.unread_count || 0);

      if (fromPoll && notificationsEnabled()) {
        const unread = list.filter((n) => !n.is_read);
        for (const n of unread) {
          if (!seenIdsRef.current.has(n.id)) {
            seenIdsRef.current.add(n.id);
            if (prevUnreadRef.current > 0 || seenIdsRef.current.size > 1) {
              showBrowserNotification(n);
            }
          }
        }
      }

      prevUnreadRef.current = data.unread_count || 0;
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [showBrowserNotification]);

  useEffect(() => {
    loadNotifications();
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission().catch(() => {});
    }
    const interval = setInterval(() => loadNotifications(true), 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'entry_saved': return '✅';
      case 'approval': return '✅';
      case 'reminder': return '🔔';
      case 'return_gift': return '🎁';
      case 'function_date': return '📅';
      default: return '📢';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              type="button"
              onClick={() => loadNotifications()}
              className="text-[10px] text-[#FFC107] font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer ${
                    n.is_read ? 'opacity-70' : ''
                  }`}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getNotificationIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{n.message}</p>
                      )}
                      {n.event_name && (
                        <p className="text-xs text-gray-400 mt-0.5">Event: {n.event_name}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="text-gray-300 hover:text-red-500 p-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

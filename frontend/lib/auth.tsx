'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, authApi, registerUnauthorizedHandler } from './api';
import { buildLoginUrl, sanitizeReturnTo } from './authNavigation';
import { shouldRedirectToLogin } from './sessionAuth';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

function readStoredSession(): { token: string; user: User } | null {
  const t = localStorage.getItem('moi_token');
  const u = localStorage.getItem('moi_user');
  if (!t || t === 'undefined' || t === 'null') return null;
  if (!u || u === 'undefined' || u === 'null') return null;
  try {
    const parsedUser = JSON.parse(u);
    if (parsedUser && typeof parsedUser === 'object') {
      return { token: t, user: parsedUser as User };
    }
  } catch {
    // fall through
  }
  return null;
}

function clearStoredSession(): void {
  localStorage.removeItem('moi_token');
  localStorage.removeItem('moi_user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback((callServer: boolean) => {
    if (callServer && localStorage.getItem('moi_token')) {
      authApi.logout().catch(() => {});
    }
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession(true);
  }, [clearSession]);

  const login = useCallback((t: string, u: User) => {
    localStorage.setItem('moi_token', t);
    localStorage.setItem('moi_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = readStoredSession();
      if (!stored) {
        clearStoredSession();
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await authApi.me();
        if (cancelled) return;
        setToken(stored.token);
        setUser(res.user);
        localStorage.setItem('moi_user', JSON.stringify(res.user));
      } catch {
        if (cancelled) return;
        clearStoredSession();
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession(false);
      const path = window.location.pathname;
      const search = window.location.search;
      if (!shouldRedirectToLogin(path)) return;
      const returnTo = sanitizeReturnTo(path + search) ?? path;
      router.replace(buildLoginUrl(returnTo));
    });
    return () => registerUnauthorizedHandler(null);
  }, [clearSession, router]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

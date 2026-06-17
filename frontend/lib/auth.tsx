'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from './api';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('moi_token');
    const u = localStorage.getItem('moi_user');

    const invalidToken = !t || t === 'undefined' || t === 'null';
    const invalidUser = !u || u === 'undefined' || u === 'null';

    if (invalidToken || invalidUser) {
      localStorage.removeItem('moi_token');
      localStorage.removeItem('moi_user');
    } else {
      try {
        const parsedUser = JSON.parse(u);
        if (parsedUser && typeof parsedUser === 'object') {
          setToken(t);
          setUser(parsedUser as User);
        } else {
          throw new Error('Invalid stored user');
        }
      } catch {
        localStorage.removeItem('moi_token');
        localStorage.removeItem('moi_user');
      }
    }

    setLoading(false);
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem('moi_token', t);
    localStorage.setItem('moi_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('moi_token');
    localStorage.removeItem('moi_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

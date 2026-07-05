import { create } from 'zustand';
import { authApi } from '../api';
import { setToken, clearToken, getToken } from '../api/client';
import { resetToMain } from '../navigation/navigationRef';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  profileSetupRequired: boolean;
  loading: boolean;
  initialized: boolean;
  login: (token: string, user: User, options?: { resetNav?: boolean; profileSetupRequired?: boolean }) => Promise<void>;
  completeProfileSetup: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setUser: (user: User) => void;
}

function needsProfileSetup(user: User): boolean {
  return !user.name?.trim();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profileSetupRequired: false,
  loading: false,
  initialized: false,

  login: async (token, user, options?: { resetNav?: boolean; profileSetupRequired?: boolean }) => {
    await setToken(token);
    const profileRequired = options?.profileSetupRequired ?? needsProfileSetup(user);
    set({ user, profileSetupRequired: profileRequired });
    if (!profileRequired && options?.resetNav !== false) {
      resetToMain();
    }
  },

  completeProfileSetup: (user) => {
    set({ user, profileSetupRequired: false });
    resetToMain();
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if server call fails
    }
    await clearToken();
    set({ user: null, profileSetupRequired: false });
  },

  refreshUser: async () => {
    try {
      const res = await authApi.me();
      set({ user: res.user, profileSetupRequired: needsProfileSetup(res.user) });
    } catch {
      await clearToken();
      set({ user: null, profileSetupRequired: false });
    }
  },

  bootstrap: async () => {
    set({ loading: true });
    try {
      const token = await getToken();
      if (token) {
        const res = await authApi.me();
        set({ user: res.user, profileSetupRequired: needsProfileSetup(res.user) });
      }
    } catch {
      await clearToken();
      set({ user: null, profileSetupRequired: false });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  setUser: (user) => set({ user }),
}));

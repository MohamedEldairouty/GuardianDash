import { create } from 'zustand';
import { api, ApiError, getBase, setToken } from '@/services/api';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  login: (input: { email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

function userFromApi(u: { id: number; name: string; email: string; created_at?: number }): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    passwordHash: '',
    createdAt: u.created_at ?? Date.now(),
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    const base = await getBase();
    if (!base) {
      set({ hydrated: true, user: null });
      return;
    }
    try {
      const r = await api.get<{ user: { id: number; name: string; email: string; created_at: number } }>('/auth/me');
      set({ user: userFromApi(r.user), hydrated: true });
    } catch {
      await setToken(null);
      set({ user: null, hydrated: true });
    }
  },

  register: async ({ name, email, password }) => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return { ok: false, error: 'Name is required' };
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(e)) return { ok: false, error: 'Invalid email' };
    if (password.length < 4) return { ok: false, error: 'Password too short' };

    const base = await getBase();
    if (!base) return { ok: false, error: 'Connect to the backend first (Profile → API Backend).' };

    try {
      const r = await api.post<{ token: string; user: { id: number; name: string; email: string } }>(
        '/auth/register',
        { name: name.trim(), email: e, password },
      );
      await setToken(r.token);
      set({ user: userFromApi(r.user) });
      return { ok: true };
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0) return { ok: false, error: 'Cannot reach backend — check your connection.' };
      return { ok: false, error: err?.message ?? 'Registration failed' };
    }
  },

  login: async ({ email, password }) => {
    const e = email.trim().toLowerCase();
    const base = await getBase();
    if (!base) return { ok: false, error: 'Connect to the backend first.' };

    try {
      const r = await api.post<{ token: string; user: { id: number; name: string; email: string } }>(
        '/auth/login',
        { email: e, password },
      );
      await setToken(r.token);
      set({ user: userFromApi(r.user) });
      return { ok: true };
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 0) return { ok: false, error: 'Cannot reach backend — check your connection.' };
      return { ok: false, error: err?.message ?? 'Login failed' };
    }
  },

  logout: async () => {
    await setToken(null);
    set({ user: null });
  },
}));

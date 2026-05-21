import { create } from 'zustand';
import { db, KEYS } from '@/services/db';
import { api, ApiError, getBase, getToken, setToken } from '@/services/api';
import type { User } from '@/types/user.types';

// Tiny non-crypto hash for the LOCAL-ONLY fallback. Backend uses bcrypt.
function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

interface AuthState {
  user: User | null;
  hydrated: boolean;
  remote: boolean; // true when this session is backed by the API
  hydrate: () => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  login: (input: { email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  remote: false,

  hydrate: async () => {
    // Try a token + backend resume first.
    const base = await getBase();
    const token = await getToken();
    if (base && token) {
      try {
        const r = await api.get<{ user: { id: number; name: string; email: string; created_at: number } }>('/auth/me');
        const u = r.user;
        const user: User = {
          id: String(u.id),
          name: u.name,
          email: u.email,
          passwordHash: '',
          createdAt: u.created_at,
        };
        set({ user, hydrated: true, remote: true });
        return;
      } catch {
        // token bad / backend down → fall through to local
        await setToken(null);
      }
    }

    // Local fallback session.
    const session = await db.get<{ userId: string }>(KEYS.session);
    if (!session) return set({ hydrated: true });
    const users = (await db.get<User[]>(KEYS.users)) ?? [];
    const user = users.find((u) => u.id === session.userId) ?? null;
    set({ user, hydrated: true, remote: false });
  },

  register: async ({ name, email, password }) => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return { ok: false, error: 'Name is required' };
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(e)) return { ok: false, error: 'Invalid email' };
    if (password.length < 4) return { ok: false, error: 'Password too short' };

    const base = await getBase();
    if (base) {
      try {
        const r = await api.post<{ token: string; user: { id: number; name: string; email: string } }>(
          '/auth/register', { name, email: e, password }
        );
        await setToken(r.token);
        const user: User = { id: String(r.user.id), name: r.user.name, email: r.user.email, passwordHash: '', createdAt: Date.now() };
        set({ user, remote: true });
        return { ok: true };
      } catch (err: any) {
        if (err instanceof ApiError && err.status !== 0) return { ok: false, error: err.message };
        // Network error → fall back to local register
      }
    }

    // Local fallback.
    const users = (await db.get<User[]>(KEYS.users)) ?? [];
    if (users.some((u) => u.email === e)) return { ok: false, error: 'Email already registered' };
    const newUser: User = { id: `u_${Date.now()}`, name: name.trim(), email: e, passwordHash: hash(password), createdAt: Date.now() };
    await db.set(KEYS.users, [...users, newUser]);
    await db.set(KEYS.session, { userId: newUser.id });
    set({ user: newUser, remote: false });
    return { ok: true };
  },

  login: async ({ email, password }) => {
    const e = email.trim().toLowerCase();

    const base = await getBase();
    if (base) {
      try {
        const r = await api.post<{ token: string; user: { id: number; name: string; email: string } }>(
          '/auth/login', { email: e, password }
        );
        await setToken(r.token);
        const user: User = { id: String(r.user.id), name: r.user.name, email: r.user.email, passwordHash: '', createdAt: Date.now() };
        set({ user, remote: true });
        return { ok: true };
      } catch (err: any) {
        if (err instanceof ApiError && err.status !== 0) return { ok: false, error: err.message };
      }
    }

    const users = (await db.get<User[]>(KEYS.users)) ?? [];
    const user = users.find((u) => u.email === e);
    if (!user) return { ok: false, error: 'No account with that email' };
    if (user.passwordHash !== hash(password)) return { ok: false, error: 'Wrong password' };
    await db.set(KEYS.session, { userId: user.id });
    set({ user, remote: false });
    return { ok: true };
  },

  logout: async () => {
    await setToken(null);
    await db.remove(KEYS.session);
    set({ user: null, remote: false });
  },
}));

import { create } from 'zustand';
import { db, KEYS } from '@/services/db';
import type { User } from '@/types/user.types';

// Tiny non-crypto hash — fine for a school project local-only DB.
function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

interface AuthState {
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  login: (input: { email: string; password: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    const session = await db.get<{ userId: string }>(KEYS.session);
    if (!session) return set({ hydrated: true });
    const users = (await db.get<User[]>(KEYS.users)) ?? [];
    const user = users.find((u) => u.id === session.userId) ?? null;
    set({ user, hydrated: true });
  },

  register: async ({ name, email, password }) => {
    email = email.trim().toLowerCase();
    if (!name.trim()) return { ok: false, error: 'Name is required' };
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return { ok: false, error: 'Invalid email' };
    if (password.length < 4) return { ok: false, error: 'Password too short' };

    const users = (await db.get<User[]>(KEYS.users)) ?? [];
    if (users.some((u) => u.email === email)) return { ok: false, error: 'Email already registered' };

    const newUser: User = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email,
      passwordHash: hash(password),
      createdAt: Date.now(),
    };
    await db.set(KEYS.users, [...users, newUser]);
    await db.set(KEYS.session, { userId: newUser.id });
    set({ user: newUser });
    return { ok: true };
  },

  login: async ({ email, password }) => {
    email = email.trim().toLowerCase();
    const users = (await db.get<User[]>(KEYS.users)) ?? [];
    const user = users.find((u) => u.email === email);
    if (!user) return { ok: false, error: 'No account with that email' };
    if (user.passwordHash !== hash(password)) return { ok: false, error: 'Wrong password' };
    await db.set(KEYS.session, { userId: user.id });
    set({ user });
    return { ok: true };
  },

  logout: async () => {
    await db.remove(KEYS.session);
    set({ user: null });
  },
}));

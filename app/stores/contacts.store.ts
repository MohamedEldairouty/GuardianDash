import { create } from 'zustand';
import { db, KEYS } from '@/services/db';
import type { Contact } from '@/types/user.types';

const DEFAULTS: Omit<Contact, 'id'>[] = [
  { name: 'Mom', phone: '+201001234567', relationship: 'Mother', priority: 1, enabled: true },
  { name: 'Dad', phone: '+201007654321', relationship: 'Father', priority: 2, enabled: true },
];

interface ContactsState {
  contacts: Contact[];
  loadedFor: string | null;
  load: (userId: string) => Promise<void>;
  upsert: (input: Omit<Contact, 'id'> & { id?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  setPriority: (id: string, priority: number) => Promise<void>;
  clear: () => void;
}

async function persist(userId: string, contacts: Contact[]) {
  await db.set(KEYS.contactsFor(userId), contacts);
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loadedFor: null,

  load: async (userId) => {
    let stored = await db.get<Contact[]>(KEYS.contactsFor(userId));
    if (!stored) {
      stored = DEFAULTS.map((d, i) => ({ ...d, id: `c_seed_${i}` }));
      await persist(userId, stored);
    }
    set({ contacts: stored, loadedFor: userId });
  },

  upsert: async (input) => {
    const userId = get().loadedFor;
    if (!userId) return;
    const list = get().contacts;
    let next: Contact[];
    if (input.id) {
      next = list.map((c) => (c.id === input.id ? { ...c, ...input, id: c.id } : c));
    } else {
      const newContact: Contact = { ...input, id: `c_${Date.now()}` };
      if (list.length >= 5) return;
      next = [...list, newContact];
    }
    next.sort((a, b) => a.priority - b.priority);
    await persist(userId, next);
    set({ contacts: next });
  },

  remove: async (id) => {
    const userId = get().loadedFor;
    if (!userId) return;
    const next = get().contacts.filter((c) => c.id !== id);
    await persist(userId, next);
    set({ contacts: next });
  },

  toggle: async (id) => {
    const userId = get().loadedFor;
    if (!userId) return;
    const next = get().contacts.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    await persist(userId, next);
    set({ contacts: next });
  },

  setPriority: async (id, priority) => {
    const userId = get().loadedFor;
    if (!userId) return;
    const next = get().contacts.map((c) => (c.id === id ? { ...c, priority } : c)).sort((a, b) => a.priority - b.priority);
    await persist(userId, next);
    set({ contacts: next });
  },

  clear: () => set({ contacts: [], loadedFor: null }),
}));

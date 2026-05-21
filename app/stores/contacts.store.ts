import { create } from 'zustand';
import { db, KEYS } from '@/services/db';
import { api, ApiError, getBase } from '@/services/api';
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

async function persistLocal(userId: string, contacts: Contact[]) {
  await db.set(KEYS.contactsFor(userId), contacts);
}

async function tryRemote(): Promise<boolean> {
  const base = await getBase();
  return !!base;
}

function rowsToContacts(rows: any[]): Contact[] {
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    phone: r.phone,
    relationship: r.relationship,
    priority: r.priority,
    enabled: r.enabled,
  }));
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loadedFor: null,

  load: async (userId) => {
    if (await tryRemote()) {
      try {
        const r = await api.get<{ contacts: Contact[] }>('/contacts');
        set({ contacts: rowsToContacts(r.contacts as any), loadedFor: userId });
        return;
      } catch {}
    }
    let stored = await db.get<Contact[]>(KEYS.contactsFor(userId));
    if (!stored) {
      stored = DEFAULTS.map((d, i) => ({ ...d, id: `c_seed_${i}` }));
      await persistLocal(userId, stored);
    }
    set({ contacts: stored, loadedFor: userId });
  },

  upsert: async (input) => {
    const userId = get().loadedFor;
    if (!userId) return;
    const list = get().contacts;

    if (await tryRemote()) {
      try {
        if (input.id) {
          const r = await api.put<{ contact: any }>(`/contacts/${input.id}`, input);
          const updated = rowsToContacts([r.contact])[0];
          const next = list.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.priority - b.priority);
          set({ contacts: next });
        } else {
          if (list.length >= 5) return;
          const r = await api.post<{ contact: any }>('/contacts', input);
          const created = rowsToContacts([r.contact])[0];
          const next = [...list, created].sort((a, b) => a.priority - b.priority);
          set({ contacts: next });
        }
        return;
      } catch {}
    }

    let next: Contact[];
    if (input.id) {
      next = list.map((c) => (c.id === input.id ? { ...c, ...input, id: c.id } : c));
    } else {
      if (list.length >= 5) return;
      next = [...list, { ...input, id: `c_${Date.now()}` } as Contact];
    }
    next.sort((a, b) => a.priority - b.priority);
    await persistLocal(userId, next);
    set({ contacts: next });
  },

  remove: async (id) => {
    const userId = get().loadedFor;
    if (!userId) return;
    if (await tryRemote()) {
      try { await api.del(`/contacts/${id}`); } catch {}
    }
    const next = get().contacts.filter((c) => c.id !== id);
    await persistLocal(userId, next);
    set({ contacts: next });
  },

  toggle: async (id) => {
    const userId = get().loadedFor;
    if (!userId) return;
    const target = get().contacts.find((c) => c.id === id);
    if (!target) return;
    if (await tryRemote()) {
      try { await api.put(`/contacts/${id}`, { enabled: !target.enabled }); } catch {}
    }
    const next = get().contacts.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    await persistLocal(userId, next);
    set({ contacts: next });
  },

  setPriority: async (id, priority) => {
    const userId = get().loadedFor;
    if (!userId) return;
    if (await tryRemote()) {
      try { await api.put(`/contacts/${id}`, { priority }); } catch {}
    }
    const next = get().contacts.map((c) => (c.id === id ? { ...c, priority } : c)).sort((a, b) => a.priority - b.priority);
    await persistLocal(userId, next);
    set({ contacts: next });
  },

  clear: () => set({ contacts: [], loadedFor: null }),
}));

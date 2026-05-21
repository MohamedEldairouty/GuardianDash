import { create } from 'zustand';
import { api } from '@/services/api';
import type { Contact } from '@/types/user.types';

interface ContactsState {
  contacts: Contact[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsert: (input: Omit<Contact, 'id'> & { id?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  setPriority: (id: string, priority: number) => Promise<void>;
  clear: () => void;
}

function rowsToContacts(rows: any[]): Contact[] {
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    phone: r.phone,
    relationship: r.relationship,
    priority: r.priority,
    enabled: typeof r.enabled === 'boolean' ? r.enabled : r.enabled === 1,
  }));
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const r = await api.get<{ contacts: any[] }>('/contacts');
      set({ contacts: rowsToContacts(r.contacts), loaded: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err?.message ?? 'Failed to load contacts', loaded: true });
    }
  },

  upsert: async (input) => {
    try {
      if (input.id) {
        const r = await api.put<{ contact: any }>(`/contacts/${input.id}`, input);
        const updated = rowsToContacts([r.contact])[0];
        const next = get().contacts.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.priority - b.priority);
        set({ contacts: next });
      } else {
        if (get().contacts.length >= 5) return;
        const r = await api.post<{ contact: any }>('/contacts', input);
        const created = rowsToContacts([r.contact])[0];
        const next = [...get().contacts, created].sort((a, b) => a.priority - b.priority);
        set({ contacts: next });
      }
    } catch (err: any) {
      set({ error: err?.message ?? 'Save failed' });
    }
  },

  remove: async (id) => {
    try {
      await api.del(`/contacts/${id}`);
      set({ contacts: get().contacts.filter((c) => c.id !== id) });
    } catch (err: any) {
      set({ error: err?.message ?? 'Delete failed' });
    }
  },

  toggle: async (id) => {
    const target = get().contacts.find((c) => c.id === id);
    if (!target) return;
    const optimistic = get().contacts.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    set({ contacts: optimistic });
    try {
      await api.put(`/contacts/${id}`, { enabled: !target.enabled });
    } catch (err: any) {
      // revert on failure
      set({ contacts: get().contacts.map((c) => (c.id === id ? { ...c, enabled: target.enabled } : c)), error: err?.message });
    }
  },

  setPriority: async (id, priority) => {
    try {
      await api.put(`/contacts/${id}`, { priority });
      const next = get().contacts.map((c) => (c.id === id ? { ...c, priority } : c)).sort((a, b) => a.priority - b.priority);
      set({ contacts: next });
    } catch (err: any) {
      set({ error: err?.message ?? 'Update failed' });
    }
  },

  clear: () => set({ contacts: [], loaded: false, loading: false, error: null }),
}));

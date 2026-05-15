import { create } from 'zustand';
import { db } from '@/services/db';

const KEY = 'gd:settings';

export type Sensitivity = 'low' | 'medium' | 'high';

interface Settings {
  sensitivity: Sensitivity;
}

const THRESHOLDS: Record<Sensitivity, number> = {
  low: 5.0,
  medium: 3.5,
  high: 2.5,
};

interface SettingsState extends Settings {
  loaded: boolean;
  threshold: number;
  load: () => Promise<void>;
  setSensitivity: (s: Sensitivity) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  sensitivity: 'medium',
  threshold: THRESHOLDS.medium,
  loaded: false,
  load: async () => {
    const saved = await db.get<Settings>(KEY);
    const s = saved?.sensitivity ?? 'medium';
    set({ sensitivity: s, threshold: THRESHOLDS[s], loaded: true });
  },
  setSensitivity: async (sensitivity) => {
    await db.set(KEY, { sensitivity });
    set({ sensitivity, threshold: THRESHOLDS[sensitivity] });
  },
}));

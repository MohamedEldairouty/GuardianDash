import { create } from 'zustand';
import { db } from '@/services/db';

const KEY = 'gd:settings';

export type Sensitivity = 'low' | 'medium' | 'high';

interface Settings {
  sensitivity: Sensitivity;
}

// Thresholds aligned with the STM32 firmware. Default UNSAFE trip is 1.5g.
const THRESHOLDS: Record<Sensitivity, number> = {
  low: 2.0,
  medium: 1.5,
  high: 1.2,
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

import { create } from 'zustand';
import type { CrashEvent } from '@/types/crash.types';

interface CrashState {
  active: CrashEvent | null;
  history: CrashEvent[];
  trigger: (event: CrashEvent) => void;
  dismiss: () => void;
}

export const useCrashStore = create<CrashState>((set, get) => ({
  active: null,
  history: [],
  trigger: (event) => set({ active: event }),
  dismiss: () => {
    const current = get().active;
    if (!current) return;
    set({
      active: null,
      history: [{ ...current, dismissed: true }, ...get().history],
    });
  },
}));

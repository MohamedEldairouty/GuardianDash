import { create } from 'zustand';
import type { CrashEvent } from '@/types/crash.types';
import type { TelemetryFrame } from '@/types/telemetry.types';

interface CrashState {
  active: CrashEvent | null;
  history: CrashEvent[];
  /** Set to true when the firmware reports STATUS:ACCIDENT (transition).
   *  useCrashWatch consumes and clears it. Decoupled from gForce so the
   *  dashboard keeps showing the real, live G. */
  pendingHardwareAccident: boolean;
  trigger: (event: CrashEvent, snapshot: TelemetryFrame[]) => void;
  dismiss: () => void;
  confirm: () => void;
  setPendingHardwareAccident: (v: boolean) => void;
}

export const useCrashStore = create<CrashState>((set, get) => ({
  active: null,
  history: [],
  pendingHardwareAccident: false,

  trigger: (event, snapshot) =>
    set({
      active: { ...event, snapshot },
    }),

  dismiss: () => {
    const current = get().active;
    if (!current) return;
    set({
      active: null,
      history: [{ ...current, dismissed: true }, ...get().history],
    });
  },

  confirm: () => {
    const current = get().active;
    if (!current) return;
    set({
      active: null,
      history: [{ ...current, dismissed: false }, ...get().history],
    });
  },

  setPendingHardwareAccident: (v) => set({ pendingHardwareAccident: v }),
}));

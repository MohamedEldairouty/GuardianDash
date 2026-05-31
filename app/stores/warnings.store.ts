import { create } from 'zustand';

export type WarningType = 'HARSH_BRAKE' | 'HARSH_ACCEL' | 'OVERSPEED' | 'IDLE';

export interface DrivingWarning {
  id: string;
  type: WarningType;
  timestamp: number;
  gForce?: number;
  location?: { lat: number; lng: number } | null;
}

interface WarningsState {
  history: DrivingWarning[];
  /** Most recent warning that hasn't been dismissed — shown as a banner. */
  banner: DrivingWarning | null;
  push: (w: Omit<DrivingWarning, 'id'>) => void;
  dismissBanner: () => void;
  clear: () => void;
}

const MAX_HISTORY = 50;

export const useWarningsStore = create<WarningsState>((set) => ({
  history: [],
  banner: null,
  push: (w) =>
    set((s) => {
      const event: DrivingWarning = { ...w, id: `w_${w.timestamp}_${w.type}` };
      return {
        banner: event,
        history: [event, ...s.history].slice(0, MAX_HISTORY),
      };
    }),
  dismissBanner: () => set({ banner: null }),
  clear: () => set({ history: [], banner: null }),
}));

import { create } from 'zustand';
import type { DeviceStatus, TelemetryFrame } from '@/types/telemetry.types';

const BUFFER_SIZE = 60; // ~12s at 5Hz

interface TelemetryState {
  latest: TelemetryFrame | null;
  recent: TelemetryFrame[];
  status: DeviceStatus;
  peakGRecent: number;
  setFrame: (frame: TelemetryFrame) => void;
  setStatus: (status: DeviceStatus) => void;
  resetPeak: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  latest: null,
  recent: [],
  status: 'searching',
  peakGRecent: 0,
  setFrame: (frame) =>
    set((s) => {
      const recent = [...s.recent, frame].slice(-BUFFER_SIZE);
      return {
        latest: frame,
        recent,
        status: 'connected',
        peakGRecent: Math.max(s.peakGRecent, frame.gForce),
      };
    }),
  setStatus: (status) => set({ status }),
  resetPeak: () => set({ peakGRecent: 0 }),
}));

import { create } from 'zustand';
import type { DeviceStatus, TelemetryFrame } from '@/types/telemetry.types';

interface TelemetryState {
  latest: TelemetryFrame | null;
  status: DeviceStatus;
  setFrame: (frame: TelemetryFrame) => void;
  setStatus: (status: DeviceStatus) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  latest: null,
  status: 'searching',
  setFrame: (frame) => set({ latest: frame, status: 'connected' }),
  setStatus: (status) => set({ status }),
}));

import { create } from 'zustand';
import type { DeviceStatus, TelemetryFrame } from '@/types/telemetry.types';

const BUFFER_SIZE = 200; // ~20s of history at 10 Hz — fuels the Signals tab

interface TelemetryState {
  latest: TelemetryFrame | null;
  recent: TelemetryFrame[];
  status: DeviceStatus;
  peakGRecent: number;
  liveGps: { lat: number; lng: number } | null;
  liveHeading: number | null;
  liveSpeedKph: number | null;
  hardwareConnected: boolean;
  setFrame: (frame: TelemetryFrame) => void;
  setStatus: (status: DeviceStatus) => void;
  setHardwareConnected: (connected: boolean) => void;
  setLocation: (loc: { lat: number; lng: number }, heading: number | null, speedMps: number | null) => void;
  resetPeak: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  latest: null,
  recent: [],
  status: 'searching',
  peakGRecent: 0,
  liveGps: null,
  liveHeading: null,
  liveSpeedKph: null,
  hardwareConnected: false,

  setFrame: (frame) =>
    set((s) => {
      // If we have a real GPS fix, prefer it over the mock coords.
      const merged: TelemetryFrame = s.liveGps
        ? {
            ...frame,
            location: s.liveGps,
            heading: s.liveHeading ?? frame.heading,
            speedKph: s.liveSpeedKph ?? frame.speedKph,
          }
        : frame;

      const recent = [...s.recent, merged].slice(-BUFFER_SIZE);
      return {
        latest: merged,
        recent,
        status: s.hardwareConnected ? 'connected' : 'searching',
        peakGRecent: Math.max(s.peakGRecent, merged.gForce),
      };
    }),

  setStatus: (status) => set({ status }),
  setHardwareConnected: (hardwareConnected) =>
    set({ hardwareConnected, status: hardwareConnected ? 'connected' : 'searching' }),

  setLocation: (loc, heading, speedMps) =>
    set({
      liveGps: loc,
      liveHeading: heading,
      liveSpeedKph: speedMps != null && speedMps >= 0 ? speedMps * 3.6 : null,
    }),

  resetPeak: () => set({ peakGRecent: 0 }),
}));

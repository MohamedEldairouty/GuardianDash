import { create } from 'zustand';
import { api } from '@/services/api';
import { useTripsStore } from '@/stores/trips.store';

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

interface TripRecordingState {
  recording: boolean;
  startedAt: number | null;
  path: { lat: number; lng: number }[];
  maxSpeedKph: number;
  speedSum: number;
  speedSamples: number;
  crashIds: string[];
  saving: boolean;

  start: () => void;
  addPoint: (loc: { lat: number; lng: number }, speedKph: number) => void;
  recordCrash: (id: string) => void;
  save: () => Promise<{ ok: boolean; error?: string }>;
  cancel: () => void;
}

const blank = () => ({
  recording: false,
  startedAt: null as number | null,
  path: [] as { lat: number; lng: number }[],
  maxSpeedKph: 0,
  speedSum: 0,
  speedSamples: 0,
  crashIds: [] as string[],
  saving: false,
});

export const useTripRecordingStore = create<TripRecordingState>((set, get) => ({
  ...blank(),

  start: () => {
    set({ ...blank(), recording: true, startedAt: Date.now() });
  },

  addPoint: (loc, speedKph) => {
    const s = get();
    if (!s.recording) return;
    const last = s.path[s.path.length - 1];
    // Only append if we moved at least ~5m (avoid GPS jitter padding).
    if (last && haversine(last, loc) < 0.005) return;
    set({
      path: [...s.path, loc],
      maxSpeedKph: Math.max(s.maxSpeedKph, speedKph),
      speedSum: s.speedSum + speedKph,
      speedSamples: s.speedSamples + 1,
    });
  },

  recordCrash: (id) => {
    const s = get();
    if (!s.recording || s.crashIds.includes(id)) return;
    set({ crashIds: [...s.crashIds, id] });
  },

  save: async () => {
    const s = get();
    if (!s.recording || !s.startedAt) return { ok: false, error: 'No trip in progress' };

    set({ saving: true });
    let distanceKm = 0;
    for (let i = 1; i < s.path.length; i++) {
      distanceKm += haversine(s.path[i - 1], s.path[i]);
    }
    const avgSpeedKph = s.speedSamples > 0 ? s.speedSum / s.speedSamples : 0;

    try {
      await api.post('/trips', {
        startedAt: s.startedAt,
        endedAt: Date.now(),
        distanceKm,
        maxSpeedKph: s.maxSpeedKph,
        avgSpeedKph,
        crashCount: s.crashIds.length,
        path: s.path,
      });
      await useTripsStore.getState().load();
      set({ ...blank() });
      return { ok: true };
    } catch (err: any) {
      set({ saving: false });
      return { ok: false, error: err?.message ?? 'Save failed' };
    }
  },

  cancel: () => set({ ...blank() }),
}));

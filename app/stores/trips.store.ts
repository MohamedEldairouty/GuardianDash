import { create } from 'zustand';
import { api } from '@/services/api';
import type { Trip } from '@/types/trip.types';

interface TripsState {
  trips: Trip[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  clear: () => void;
}

function rowsToTrips(rows: any[]): Trip[] {
  return rows.map((r) => ({
    id: String(r.id),
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    distanceKm: r.distanceKm,
    maxSpeedKph: r.maxSpeedKph,
    avgSpeedKph: r.avgSpeedKph,
    crashCount: r.crashCount,
    path: r.path ?? [],
  }));
}

export const useTripsStore = create<TripsState>((set) => ({
  trips: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const r = await api.get<{ trips: any[] }>('/trips');
      set({ trips: rowsToTrips(r.trips), loaded: true, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err?.message ?? 'Failed to load trips', loaded: true });
    }
  },

  clear: () => set({ trips: [], loaded: false, loading: false, error: null }),
}));

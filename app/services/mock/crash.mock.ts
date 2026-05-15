import type { CrashEvent } from '@/types/crash.types';

export function buildMockCrash(loc: { lat: number; lng: number }): CrashEvent {
  return {
    id: `crash_${Date.now()}`,
    tripId: 'trip_demo',
    timestamp: Date.now(),
    location: loc,
    peakG: 6.4,
    severity: 'severe',
    dismissed: false,
    snapshot: [],
  };
}

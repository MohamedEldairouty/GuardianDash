import type { Trip } from '@/types/trip.types';

const now = Date.now();
const hour = 3600_000;

export const mockTrips: Trip[] = [
  {
    id: 'trip_001',
    startedAt: now - 2 * hour,
    endedAt: now - 1.5 * hour,
    distanceKm: 18.4,
    maxSpeedKph: 92,
    avgSpeedKph: 41,
    crashCount: 0,
    path: [],
  },
  {
    id: 'trip_002',
    startedAt: now - 26 * hour,
    endedAt: now - 25 * hour,
    distanceKm: 32.1,
    maxSpeedKph: 118,
    avgSpeedKph: 64,
    crashCount: 1,
    path: [],
  },
  {
    id: 'trip_003',
    startedAt: now - 50 * hour,
    endedAt: now - 49.4 * hour,
    distanceKm: 7.8,
    maxSpeedKph: 56,
    avgSpeedKph: 22,
    crashCount: 0,
    path: [],
  },
  {
    id: 'trip_004',
    startedAt: now - 74 * hour,
    endedAt: now - 73 * hour,
    distanceKm: 44.2,
    maxSpeedKph: 124,
    avgSpeedKph: 71,
    crashCount: 0,
    path: [],
  },
];

export function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatWhen(ts: number): string {
  const d = new Date(ts);
  const diffH = (Date.now() - ts) / 3600_000;
  if (diffH < 24) return `Today, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  if (diffH < 48) return `Yesterday`;
  return d.toLocaleDateString();
}

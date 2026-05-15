import type { Trip } from '@/types/trip.types';

const now = Date.now();
const hour = 3600_000;

// Generate a synthetic GPS route around a center point.
function makeRoute(centerLat: number, centerLng: number, steps: number, jitter = 0.003): { lat: number; lng: number }[] {
  const pts: { lat: number; lng: number }[] = [];
  let lat = centerLat;
  let lng = centerLng;
  let dLat = jitter * 0.5;
  let dLng = jitter;
  for (let i = 0; i < steps; i++) {
    pts.push({ lat, lng });
    dLat += (Math.random() - 0.5) * jitter * 0.4;
    dLng += (Math.random() - 0.5) * jitter * 0.4;
    lat += dLat / steps;
    lng += dLng / steps;
  }
  return pts;
}

export const mockTrips: Trip[] = [
  {
    id: 'trip_001',
    startedAt: now - 2 * hour,
    endedAt: now - 1.5 * hour,
    distanceKm: 18.4,
    maxSpeedKph: 92,
    avgSpeedKph: 41,
    crashCount: 0,
    path: makeRoute(30.0444, 31.2357, 40),
  },
  {
    id: 'trip_002',
    startedAt: now - 26 * hour,
    endedAt: now - 25 * hour,
    distanceKm: 32.1,
    maxSpeedKph: 118,
    avgSpeedKph: 64,
    crashCount: 1,
    path: makeRoute(30.0626, 31.2497, 60, 0.005),
  },
  {
    id: 'trip_003',
    startedAt: now - 50 * hour,
    endedAt: now - 49.4 * hour,
    distanceKm: 7.8,
    maxSpeedKph: 56,
    avgSpeedKph: 22,
    crashCount: 0,
    path: makeRoute(30.0211, 31.2156, 25, 0.002),
  },
  {
    id: 'trip_004',
    startedAt: now - 74 * hour,
    endedAt: now - 73 * hour,
    distanceKm: 44.2,
    maxSpeedKph: 124,
    avgSpeedKph: 71,
    crashCount: 0,
    path: makeRoute(30.0731, 31.2089, 80, 0.006),
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

export function centerOfPath(path: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (!path.length) return { lat: 30.0444, lng: 31.2357 };
  const lat = path.reduce((s, p) => s + p.lat, 0) / path.length;
  const lng = path.reduce((s, p) => s + p.lng, 0) / path.length;
  return { lat, lng };
}

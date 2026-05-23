/**
 * Detects driving sessions from the phone's GPS and posts them to the
 * backend as trips.
 *
 * Trip lifecycle:
 *   • Trip START when speed climbs above MOVING_SPEED for a few samples.
 *   • Trip END when speed stays below STOPPED_SPEED continuously for
 *     STOPPED_DURATION_MS (default 60 s).
 *   • Each path point is appended only when GPS gives us a fresh reading.
 *
 * Crash count is incremented whenever the crash store records a new event
 * during the active trip.
 *
 * Mount once at app root (in _layout.tsx).
 */
import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useCrashStore } from '@/stores/crash.store';
import { api } from '@/services/api';
import { useTripsStore } from '@/stores/trips.store';

const MOVING_SPEED_KPH = 5;        // start when faster than walking
const STOPPED_SPEED_KPH = 1;       // call it stopped under this
const STOPPED_DURATION_MS = 60_000;
const MIN_DISTANCE_KM = 0.1;       // ignore tiny GPS-drift "trips"

interface TripState {
  startedAt: number | null;
  path: { lat: number; lng: number }[];
  maxSpeed: number;
  speedSum: number;
  speedSamples: number;
  lastMovingTime: number;
  crashCount: number;
  crashIdsSeen: Set<string>;
}

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

function blank(): TripState {
  return {
    startedAt: null,
    path: [],
    maxSpeed: 0,
    speedSum: 0,
    speedSamples: 0,
    lastMovingTime: 0,
    crashCount: 0,
    crashIdsSeen: new Set(),
  };
}

export function useTripRecorder() {
  const tripRef = useRef<TripState>(blank());
  const liveGps = useTelemetryStore((s) => s.liveGps);
  const liveSpeedKph = useTelemetryStore((s) => s.liveSpeedKph) ?? 0;
  const crashHistory = useCrashStore((s) => s.history);
  const reloadTrips = useTripsStore((s) => s.load);

  // Track new crashes that happen during an active trip.
  useEffect(() => {
    const trip = tripRef.current;
    if (trip.startedAt === null) return;
    for (const c of crashHistory) {
      if (c.timestamp >= trip.startedAt && !trip.crashIdsSeen.has(c.id)) {
        trip.crashIdsSeen.add(c.id);
        trip.crashCount += 1;
      }
    }
  }, [crashHistory]);

  useEffect(() => {
    const trip = tripRef.current;
    const now = Date.now();
    if (!liveGps) return;

    const moving = liveSpeedKph > MOVING_SPEED_KPH;
    const stopped = liveSpeedKph < STOPPED_SPEED_KPH;

    if (moving) {
      // Start the trip if it's the first movement.
      if (trip.startedAt === null) {
        trip.startedAt = now;
        trip.path = [liveGps];
        trip.maxSpeed = liveSpeedKph;
        trip.speedSum = liveSpeedKph;
        trip.speedSamples = 1;
        trip.crashCount = 0;
        trip.crashIdsSeen = new Set();
      } else {
        // Append only if the GPS moved a bit (avoid duplicate points).
        const last = trip.path[trip.path.length - 1];
        if (!last || haversine(last, liveGps) > 0.005) {
          trip.path.push(liveGps);
        }
        trip.maxSpeed = Math.max(trip.maxSpeed, liveSpeedKph);
        trip.speedSum += liveSpeedKph;
        trip.speedSamples += 1;
      }
      trip.lastMovingTime = now;
    } else if (stopped && trip.startedAt !== null) {
      // Long-enough stop ends the trip.
      if (now - trip.lastMovingTime > STOPPED_DURATION_MS) {
        finalizeTrip(trip, now, reloadTrips).catch((err) => {
          console.warn('[trip] save failed:', err?.message ?? err);
        });
        tripRef.current = blank();
      }
    }
  }, [liveGps, liveSpeedKph, reloadTrips]);
}

async function finalizeTrip(
  trip: TripState,
  endedAt: number,
  reloadTrips: () => Promise<void>,
) {
  if (trip.startedAt === null) return;
  const startedAt = trip.startedAt;

  // Compute total distance.
  let distanceKm = 0;
  for (let i = 1; i < trip.path.length; i++) {
    distanceKm += haversine(trip.path[i - 1], trip.path[i]);
  }
  if (distanceKm < MIN_DISTANCE_KM) return;   // GPS jitter, ignore

  const avgSpeedKph = trip.speedSamples > 0 ? trip.speedSum / trip.speedSamples : 0;

  await api.post('/trips', {
    startedAt,
    endedAt,
    distanceKm,
    maxSpeedKph: trip.maxSpeed,
    avgSpeedKph,
    crashCount: trip.crashCount,
    path: trip.path,
  });

  // Refresh the in-app trip list so the new trip shows up immediately.
  await reloadTrips();
}

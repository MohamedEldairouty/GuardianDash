import type { TelemetryFrame } from './telemetry.types';

export interface Trip {
  id: string;
  startedAt: number;
  endedAt: number;
  distanceKm: number;
  maxSpeedKph: number;
  avgSpeedKph: number;
  crashCount: number;
  frames?: TelemetryFrame[];
  path: { lat: number; lng: number }[];
}

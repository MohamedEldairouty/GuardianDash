import type { TelemetryFrame } from './telemetry.types';

export type CrashSeverity = 'minor' | 'moderate' | 'severe';

export interface CrashEvent {
  id: string;
  tripId: string;
  timestamp: number;
  location: { lat: number; lng: number };
  peakG: number;
  severity: CrashSeverity;
  dismissed: boolean;
  snapshot: TelemetryFrame[];
}

/**
 * Watches incoming telemetry frames and automatically fires the crash flow
 * when G-force exceeds the configured threshold (or when the firmware
 * explicitly reports STATUS:ACCIDENT / UNSAFE).
 *
 * Mount once at the app root (in _layout.tsx).
 */
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useCrashStore } from '@/stores/crash.store';
import { useSettingsStore } from '@/stores/settings.store';
import * as haptics from '@/services/haptics';
import type { CrashEvent, CrashSeverity } from '@/types/crash.types';

/** Minimum gap between two crash alerts, so a sustained shake doesn't fire 10 times in a row. */
const COOLDOWN_MS = 60_000;

function severityFor(g: number, threshold: number): CrashSeverity {
  if (g >= threshold * 2.0) return 'severe';
  if (g >= threshold * 1.4) return 'moderate';
  return 'minor';
}

export function useCrashWatch() {
  const lastFiredRef = useRef(0);
  const latest = useTelemetryStore((s) => s.latest);
  const recent = useTelemetryStore((s) => s.recent);
  const liveGps = useTelemetryStore((s) => s.liveGps);
  const threshold = useSettingsStore((s) => s.threshold);
  const active = useCrashStore((s) => s.active);
  const trigger = useCrashStore((s) => s.trigger);

  useEffect(() => {
    if (!latest) return;
    if (active) return;                   // alert already open — don't stack
    if (latest.gForce <= threshold) return;

    const now = Date.now();
    if (now - lastFiredRef.current < COOLDOWN_MS) return;
    lastFiredRef.current = now;

    const event: CrashEvent = {
      id: `crash_${now}`,
      tripId: 'current',
      timestamp: now,
      location: liveGps ?? latest.location,
      peakG: latest.gForce,
      severity: severityFor(latest.gForce, threshold),
      dismissed: false,
      snapshot: [],
    };

    haptics.crash();
    trigger(event, recent);
    router.push('/alert');
  }, [latest, threshold, active, trigger, recent, liveGps]);
}

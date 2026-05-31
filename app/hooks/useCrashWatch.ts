/**
 * Watches incoming telemetry frames and fires the crash flow when:
 *   • G-force exceeds the configured threshold, OR
 *   • The firmware reports a SAFE→ACCIDENT transition via STATUS field
 *     (signaled through crashStore.pendingHardwareAccident).
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

/** Minimum gap between two crash alerts so noise doesn't fire repeatedly. */
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
  const pending = useCrashStore((s) => s.pendingHardwareAccident);
  const setPending = useCrashStore((s) => s.setPendingHardwareAccident);

  useEffect(() => {
    if (active) return;                       // alert already open — don't stack
    // We reserve the full-screen crash alert for truly severe events.
    // HARSH_BRAKE / HARSH_ACCEL from the firmware go to the warning banner
    // (handled separately by the WarningBanner component).
    const SEVERE_MULTIPLIER = 1.7;
    const severeByG = !!latest && latest.gForce > threshold * SEVERE_MULTIPLIER;
    if (!severeByG && !pending) return;

    const now = Date.now();
    if (now - lastFiredRef.current < COOLDOWN_MS) {
      // Still clear the hardware flag so it doesn't re-trip after the cooldown.
      if (pending) setPending(false);
      return;
    }
    lastFiredRef.current = now;

    const peakG = latest?.gForce ?? threshold * 1.5;
    const event: CrashEvent = {
      id: `crash_${now}`,
      tripId: 'current',
      timestamp: now,
      location: liveGps ?? latest?.location ?? { lat: 30.0444, lng: 31.2357 },
      peakG,
      severity: severityFor(peakG, threshold),
      dismissed: false,
      snapshot: [],
    };

    haptics.crash();
    trigger(event, recent);
    if (pending) setPending(false);
    router.push('/alert');
  }, [latest, threshold, active, trigger, recent, liveGps, pending, setPending]);
}

import { useEffect } from 'react';
import { mockTelemetry } from '@/services/mock/telemetry.mock';
import { useTelemetryStore } from '@/stores/telemetry.store';

/**
 * Subscribes to mock telemetry frames. Once the real hardware bridge
 * is connected (see services/liveBridge.ts), the bridge pushes frames
 * directly into the store; the mock keeps running in the background
 * but its output is replaced by the bridge's setFrame() calls.
 */
export function useLiveTelemetry() {
  const setFrame = useTelemetryStore((s) => s.setFrame);
  const hardwareConnected = useTelemetryStore((s) => s.hardwareConnected);

  useEffect(() => {
    if (hardwareConnected) return; // bridge is in charge
    const unsub = mockTelemetry.subscribe(setFrame);
    return unsub;
  }, [setFrame, hardwareConnected]);
}

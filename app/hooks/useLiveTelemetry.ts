import { useEffect } from 'react';
import { mockTelemetry } from '@/services/mock/telemetry.mock';
import { useTelemetryStore } from '@/stores/telemetry.store';

export function useLiveTelemetry() {
  const setFrame = useTelemetryStore((s) => s.setFrame);
  useEffect(() => {
    const unsub = mockTelemetry.subscribe(setFrame);
    return unsub;
  }, [setFrame]);
}

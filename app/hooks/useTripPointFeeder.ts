/**
 * While a trip is being recorded, feed live GPS + speed into the recording
 * store. Also forwards any new crash events as crash IDs.
 *
 * Mount once at the app root.
 */
import { useEffect } from 'react';
import { useTelemetryStore } from '@/stores/telemetry.store';
import { useCrashStore } from '@/stores/crash.store';
import { useTripRecordingStore } from '@/stores/tripRecording.store';

export function useTripPointFeeder() {
  const liveGps = useTelemetryStore((s) => s.liveGps);
  const liveSpeedKph = useTelemetryStore((s) => s.liveSpeedKph) ?? 0;
  const crashHistory = useCrashStore((s) => s.history);
  const recording = useTripRecordingStore((s) => s.recording);
  const addPoint = useTripRecordingStore((s) => s.addPoint);
  const recordCrash = useTripRecordingStore((s) => s.recordCrash);

  useEffect(() => {
    if (!recording || !liveGps) return;
    addPoint(liveGps, liveSpeedKph);
  }, [recording, liveGps, liveSpeedKph, addPoint]);

  useEffect(() => {
    if (!recording) return;
    crashHistory.forEach((c) => recordCrash(c.id));
  }, [recording, crashHistory, recordCrash]);
}

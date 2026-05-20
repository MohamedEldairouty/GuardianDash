import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useTelemetryStore } from '@/stores/telemetry.store';

/**
 * Real GPS feed.
 * - On web, expo-location wraps the browser geolocation API.
 * - On native, asks for foreground permission and streams updates.
 * Falls back silently if denied — the mock telemetry still drives the dashboard.
 */
export function useDeviceGPS() {
  const setLocation = useTelemetryStore((s) => s.setLocation);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        // One initial fix, fast.
        try {
          const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled) {
            setLocation(
              { lat: first.coords.latitude, lng: first.coords.longitude },
              first.coords.heading ?? null,
              first.coords.speed ?? null,
            );
          }
        } catch {}

        // Then stream updates.
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
          (loc) => {
            setLocation(
              { lat: loc.coords.latitude, lng: loc.coords.longitude },
              loc.coords.heading ?? null,
              loc.coords.speed ?? null,
            );
          },
        );
      } catch {
        // ignore — mock GPS will continue
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [setLocation]);
}

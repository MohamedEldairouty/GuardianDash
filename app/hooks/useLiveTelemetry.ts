/**
 * Telemetry subscription.
 *
 * Real production behaviour: this hook does nothing on its own. Live
 * telemetry frames are pushed into the store by:
 *   - services/ble.ts (HM-10 BLE — primary path, once paired)
 *
 * Until a transport is connected, the dashboard shows a "waiting for
 * black box" state. No more mock data stream.
 */
export function useLiveTelemetry() {
  // intentionally empty
}

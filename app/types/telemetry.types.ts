export interface TelemetryFrame {
  timestamp: number;
  speedKph: number;
  gForce: number;
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  location: { lat: number; lng: number };
  heading: number;
}

export type DeviceStatus = 'connected' | 'searching' | 'offline';

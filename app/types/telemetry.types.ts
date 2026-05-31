export interface TelemetryFrame {
  timestamp: number;
  speedKph: number;
  gForce: number;
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  location: { lat: number; lng: number };
  heading: number;
  /** Hall-effect sensor digital state (0/1). Provided by the firmware. */
  hallState?: 0 | 1;
  /** Cumulative wheel-pulse count since reset — used to derive rotational speed. */
  pulseCount?: number;
  /** Motor PWM duty (0-100) — proxy for "throttle" while the demo car drives itself. */
  pwm?: number;
  /** Coarse driving phase from the firmware state machine
   *  (NORMAL_DRIVE | HARSH_BRAKE | STOP | SLOW_BRAKE | HARSH_ACCEL | FAST_CRUISE). */
  event?: string;
  /** Active alert level (NONE | HARSH_BRAKE | HARSH_ACCEL | …) */
  alert?: string;
}

export type DeviceStatus = 'connected' | 'searching' | 'offline';

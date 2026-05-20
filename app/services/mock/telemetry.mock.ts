import type { TelemetryFrame } from '@/types/telemetry.types';

type Listener = (frame: TelemetryFrame) => void;

/**
 * Mock stream that mirrors the real STM32 + MPU6050 firmware output.
 * The MCU reads accel X/Y/Z at ±2g range and computes:
 *     G = sqrt(Ax^2 + Ay^2 + Az^2)
 * Gravity gives a baseline of ~1.0g when stationary.
 * GPS/speed are NOT on the current hardware — emitted here purely so the
 * map and speed gauge have something to render for the demo.
 */
class MockTelemetryStream {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private t = 0;
  private lat = 30.0444;
  private lng = 31.2357;

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 500); // match hardware 500ms cadence
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private tick() {
    this.t += 0.5;

    // Simulated accelerometer values in g (gravity component lives in Z)
    const ax = Math.sin(this.t / 2) * 0.08 + (Math.random() - 0.5) * 0.04;
    const ay = Math.cos(this.t / 3) * 0.06 + (Math.random() - 0.5) * 0.04;
    const az = 1.0 + Math.sin(this.t * 1.7) * 0.04 + (Math.random() - 0.5) * 0.03;
    const gForce = Math.sqrt(ax * ax + ay * ay + az * az);

    // Demo-only fields (not produced by hardware yet)
    const baseSpeed = 60 + Math.sin(this.t / 8) * 25;
    const speedKph = Math.max(0, baseSpeed + (Math.random() - 0.5) * 4);
    this.lat += 0.00004;
    this.lng += 0.00006;

    const frame: TelemetryFrame = {
      timestamp: Date.now(),
      speedKph,
      gForce,
      accel: { x: ax, y: ay, z: az },
      gyro: { x: 0, y: 0, z: 0 },
      location: { lat: this.lat, lng: this.lng },
      heading: (this.t * 5) % 360,
    };

    this.listeners.forEach((fn) => fn(frame));
  }

  /** Synthetic crash spike — same shape the MPU6050 would deliver during impact. */
  fireCrashSpike() {
    const frame: TelemetryFrame = {
      timestamp: Date.now(),
      speedKph: 0,
      gForce: 3.2,
      accel: { x: -2.1, y: 1.4, z: 1.0 },
      gyro: { x: 0, y: 0, z: 0 },
      location: { lat: this.lat, lng: this.lng },
      heading: 0,
    };
    this.listeners.forEach((fn) => fn(frame));
  }
}

export const mockTelemetry = new MockTelemetryStream();

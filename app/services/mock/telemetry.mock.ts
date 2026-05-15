import type { TelemetryFrame } from '@/types/telemetry.types';

type Listener = (frame: TelemetryFrame) => void;

class MockTelemetryStream {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private t = 0;
  private lat = 30.0444;
  private lng = 31.2357;

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 200);
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
    this.t += 0.2;
    const baseSpeed = 60 + Math.sin(this.t / 8) * 25;
    const jitter = (Math.random() - 0.5) * 4;
    const speedKph = Math.max(0, baseSpeed + jitter);

    const gForce = 1 + Math.abs(Math.sin(this.t / 3)) * 0.6 + Math.random() * 0.15;

    this.lat += 0.00002;
    this.lng += 0.00003;

    const frame: TelemetryFrame = {
      timestamp: Date.now(),
      speedKph,
      gForce,
      accel: {
        x: Math.sin(this.t) * 0.5,
        y: Math.cos(this.t / 2) * 0.4,
        z: 9.8 + Math.sin(this.t * 2) * 0.2,
      },
      gyro: {
        x: Math.sin(this.t / 4) * 5,
        y: Math.cos(this.t / 5) * 5,
        z: Math.sin(this.t / 6) * 3,
      },
      location: { lat: this.lat, lng: this.lng },
      heading: (this.t * 5) % 360,
    };

    this.listeners.forEach((fn) => fn(frame));
  }

  /** Fire a synthetic crash spike for demo purposes. */
  fireCrashSpike() {
    const frame: TelemetryFrame = {
      timestamp: Date.now(),
      speedKph: 0,
      gForce: 6.4,
      accel: { x: -5.2, y: 2.1, z: 9.8 },
      gyro: { x: 90, y: -45, z: 30 },
      location: { lat: this.lat, lng: this.lng },
      heading: 0,
    };
    this.listeners.forEach((fn) => fn(frame));
  }
}

export const mockTelemetry = new MockTelemetryStream();

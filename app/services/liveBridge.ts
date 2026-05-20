import { io, type Socket } from 'socket.io-client';
import { db } from '@/services/db';
import { useTelemetryStore } from '@/stores/telemetry.store';
import type { TelemetryFrame } from '@/types/telemetry.types';

const KEY_URL = 'gd:bridge-url';

interface BridgeFrame {
  timestamp: number;
  gForce: number;
  accel: { x: number; y: number; z: number };
}

let socket: Socket | null = null;
let currentUrl: string | null = null;

export async function loadBridgeUrl(): Promise<string | null> {
  return (await db.get<string>(KEY_URL)) ?? null;
}

export async function saveBridgeUrl(url: string | null): Promise<void> {
  if (url) await db.set(KEY_URL, url);
  else await db.remove(KEY_URL);
}

export function disconnectBridge() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUrl = null;
  }
  useTelemetryStore.getState().setHardwareConnected(false);
}

export function connectBridge(url: string) {
  if (socket && currentUrl === url) return;
  disconnectBridge();
  currentUrl = url;

  socket = io(url, { transports: ['websocket'], reconnection: true });

  socket.on('connect', () => {
    useTelemetryStore.getState().setHardwareConnected(true);
  });
  socket.on('disconnect', () => {
    useTelemetryStore.getState().setHardwareConnected(false);
  });
  socket.on('telemetry', (raw: BridgeFrame) => {
    const store = useTelemetryStore.getState();
    const live = store.liveGps;
    const frame: TelemetryFrame = {
      timestamp: raw.timestamp,
      gForce: raw.gForce,
      accel: raw.accel,
      gyro: { x: 0, y: 0, z: 0 },
      location: live ?? { lat: 30.0444, lng: 31.2357 },
      heading: store.liveHeading ?? 0,
      speedKph: store.liveSpeedKph ?? 0,
    };
    store.setFrame(frame);
  });
  socket.on('connect_error', () => {
    useTelemetryStore.getState().setHardwareConnected(false);
  });
}

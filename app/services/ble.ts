/**
 * Bluetooth Low Energy transport for the Vehicle_BlackBox.
 *
 * Pairs with an HM-10 (or compatible CC2541/CC2640 module) that bridges
 * STM32 USART2 ↔ BLE. The firmware emits one CSV line per measurement;
 * this module reassembles the stream and pushes frames into the same
 * telemetry store the dashboard reads from.
 *
 * Standard HM-10 GATT:
 *   Service        FFE0
 *   Characteristic FFE1   (notify + write — UART pipe)
 */
import { BleManager, type Device, type Subscription } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import { useTelemetryStore } from '@/stores/telemetry.store';
import type { TelemetryFrame } from '@/types/telemetry.types';

const SERVICE_UUID        = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

let manager: BleManager | null = null;
let connectedDevice: Device | null = null;
let monitorSub: Subscription | null = null;
let disconnectSub: Subscription | null = null;
let rxBuffer = '';

function mgr(): BleManager {
  if (!manager) manager = new BleManager();
  return manager;
}

// --------------------------------------------------------------------------
// Permissions

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // SDK level 31+ uses the new neighbor-app Bluetooth permissions.
  // Older Android conflates BLE scanning with location.
  const apiLevel = Number(Platform.Version);
  const perms: any[] =
    apiLevel >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const result = await PermissionsAndroid.requestMultiple(perms);
  return Object.values(result).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
}

// --------------------------------------------------------------------------
// Scan

export interface ScanResult {
  id: string;
  name: string;
  rssi: number | null;
}

/** Start a scan. Calls `onDevice` for each unique device seen.
 *  Returns a stop function. */
export function startScan(onDevice: (d: ScanResult) => void): () => void {
  const m = mgr();
  const seen = new Set<string>();
  m.startDeviceScan(null, null, (err, device) => {
    if (err) {
      console.warn('[ble] scan error:', err.message);
      return;
    }
    if (!device || seen.has(device.id)) return;
    seen.add(device.id);
    onDevice({
      id: device.id,
      name: device.name ?? device.localName ?? 'Unnamed device',
      rssi: device.rssi,
    });
  });
  return () => {
    try { m.stopDeviceScan(); } catch {}
  };
}

// --------------------------------------------------------------------------
// Connect / disconnect

export async function connect(deviceId: string): Promise<void> {
  const m = mgr();
  await disconnect();

  const device = await m.connectToDevice(deviceId, { autoConnect: false, timeout: 8000 });
  await device.discoverAllServicesAndCharacteristics();
  connectedDevice = device;

  rxBuffer = '';
  monitorSub = device.monitorCharacteristicForService(
    SERVICE_UUID,
    CHARACTERISTIC_UUID,
    (err, char) => {
      if (err) {
        console.warn('[ble] monitor error:', err.message);
        return;
      }
      if (!char?.value) return;
      const chunk = Buffer.from(char.value, 'base64').toString('utf-8');
      handleData(chunk);
    },
  );

  disconnectSub = device.onDisconnected(() => {
    useTelemetryStore.getState().setHardwareConnected(false);
    cleanup();
  });

  useTelemetryStore.getState().setHardwareConnected(true);
}

export async function disconnect(): Promise<void> {
  if (connectedDevice) {
    try { await connectedDevice.cancelConnection(); } catch {}
  }
  cleanup();
  useTelemetryStore.getState().setHardwareConnected(false);
}

function cleanup() {
  monitorSub?.remove(); monitorSub = null;
  disconnectSub?.remove(); disconnectSub = null;
  connectedDevice = null;
  rxBuffer = '';
}

export function isConnected(): boolean {
  return !!connectedDevice;
}

export function connectedDeviceName(): string | null {
  return connectedDevice?.name ?? null;
}

// --------------------------------------------------------------------------
// Parsing — same format the bridge used:  G:1.04,X:0.05,Y:-0.01,Z:1.00

function handleData(chunk: string) {
  rxBuffer += chunk;
  let nl;
  while ((nl = rxBuffer.indexOf('\n')) >= 0) {
    const line = rxBuffer.slice(0, nl).trim();
    rxBuffer = rxBuffer.slice(nl + 1);
    if (line) parseLine(line);
  }
}

function parseLine(line: string) {
  // Pull both numeric and string fields out of the CSV.
  // Examples:
  //   G:1.04,X:0.05,Y:-0.01,Z:1.00,STATUS:SAFE
  //   G:2.10,X:-1.20,Y:0.40,Z:0.90,STATUS:ACCIDENT
  const nums: Record<string, number> = {};
  const strs: Record<string, string> = {};
  for (const raw of line.split(',')) {
    const part = raw.trim();
    const numMatch = part.match(/^([A-Za-z]+)\s*[:=]\s*(-?\d+(?:\.\d+)?)$/);
    if (numMatch) {
      nums[numMatch[1].toLowerCase()] = parseFloat(numMatch[2]);
      continue;
    }
    const strMatch = part.match(/^([A-Za-z]+)\s*[:=]\s*([A-Za-z_][A-Za-z0-9_-]*)$/);
    if (strMatch) {
      strs[strMatch[1].toLowerCase()] = strMatch[2].toUpperCase();
    }
  }
  if (nums.g === undefined) return;

  const store = useTelemetryStore.getState();
  const frame: TelemetryFrame = {
    timestamp: Date.now(),
    gForce: nums.g,
    accel: { x: nums.x ?? 0, y: nums.y ?? 0, z: nums.z ?? 1 },
    gyro: { x: 0, y: 0, z: 0 },
    location: store.liveGps ?? { lat: 30.0444, lng: 31.2357 },
    heading: store.liveHeading ?? 0,
    speedKph: store.liveSpeedKph ?? 0,
  };
  store.setFrame(frame);

  // If the hardware tells us STATUS:ACCIDENT, fire the crash flow even if
  // the app's local threshold hasn't tripped (e.g. firmware uses a different
  // calibration). The app's existing crash detection still runs on top.
  if (strs.status === 'ACCIDENT' || strs.status === 'UNSAFE') {
    // Hook for future: dispatch a crash event from here. For now, the
    // dashboard reflects the elevated G and the user can read STATUS in
    // the LCD mirror.
  }
}

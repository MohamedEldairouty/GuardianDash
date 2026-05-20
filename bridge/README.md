# 🔌 GuardianDash UART → WebSocket Bridge

A tiny Node.js script that reads the STM32 black box over USB-serial and
streams telemetry to the mobile app in real time.

```
STM32 ──USB-serial──► bridge.js ──WebSocket──► GuardianDash app
   (CSV lines)        (parses)                 (live LCD mirror)
```

## Firmware contract

The STM32 must print one line per measurement:
```
G:1.23,X:0.05,Y:-0.01,Z:1.00\r\n
```
The order of fields doesn't matter; missing fields default to 0. Anything
unparseable is ignored — safe to mix with debug `printf`s.

## Run

```bash
cd bridge
npm install

# Find the right COM port (Windows) or /dev/ttyUSB0 (Linux/Mac):
npm run list

# Then point the bridge at it:
GD_SERIAL_PORT=COM3 npm start          # Windows
# or
GD_SERIAL_PORT=/dev/ttyUSB0 npm start  # Linux/Mac
```

The bridge listens on `ws://<your-ip>:4001`. In the mobile app's
**Profile → Black box** settings, paste this URL to switch from mock
telemetry to live hardware.

## Env vars
| Var | Default | Meaning |
|---|---|---|
| `GD_SERIAL_PORT` | `COM3` | Serial port path |
| `GD_BAUD` | `115200` | Baud rate (match firmware) |
| `GD_WS_PORT` | `4001` | Port the bridge listens on |

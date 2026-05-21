# 📡 Going wireless — kill the USB cable

Three ways to make the STM32 talk to the phone without USB. Pick one.

## Option A — HC-05 Bluetooth Classic *(simplest, ~$3)*

The HC-05 is a tiny Bluetooth module that bridges UART ↔ Bluetooth SPP
(Serial Port Profile). Your firmware doesn't change at all — it just sends
the same CSV lines as today, but to the HC-05's RX pin instead of the USB
adapter.

### Wiring
```
STM32       HC-05
─────       ─────
GND  ────── GND
5V   ────── VCC     (HC-05 has on-board regulator — 5V is fine)
PA2  ────── RX      (STM32 TX2 → HC-05 RX)
PA3  ────── TX      (STM32 RX2 ← HC-05 TX) — optional
```

### What changes
- **Firmware:** nothing — your existing `usart.c` keeps printing CSV
- **Bridge:** no longer needed (HC-05 replaces it)
- **App:** add Bluetooth Classic SPP support
- **Phone:** pair with the HC-05 once via Android Settings (PIN is usually `1234` or `0000`)

### App library
`react-native-bluetooth-classic` works perfectly with HC-05.
**But it doesn't work in Expo Go** — you'd need to build a **dev client**
(`eas build --profile development`) once. After that, every code change
reloads instantly like normal Expo Go.

### Power
HC-05 draws ~30 mA. Total system with STM32 + LCD + MPU6050 + HC-05 ≈
**150 mA**. Any 5V power bank ≥ 1000 mAh runs for 6+ hours.

---

## Option B — HM-10 BLE *(better battery life)*

Same idea but using Bluetooth Low Energy. Pairs more cleanly with both iOS
and Android. Slightly more expensive (~$5).

### Wiring
```
STM32      HM-10
─────      ─────
GND ────── GND
3.3V ───── VCC      (HM-10 accepts 3.3-5V; STM32 logic is 3.3V so no level shifter needed)
PA2  ───── RX       (STM32 TX2 → HM-10 RX)
PA3  ───── TX       (HM-10 TX → STM32 RX2, optional for now)
```

### Firmware change needed
**One line.** HM-10 default baud is **9600**, our firmware defaults to 115200.
In `Core/Src/usart.c`, change:
```c
#define USART2_BRR  USART2_BRR_115200_16MHZ
```
to:
```c
#define USART2_BRR  USART2_BRR_9600_16MHZ
```
Then rebuild & reflash.

### App library
`react-native-ble-plx` — Expo has a config plugin for it. Same dev-client
build requirement as HC-05. The library is also more polished than the BT
Classic one — recommended for production apps.

---

## Option C — ESP32 / ESP8266 over WiFi *(cloud-native)*

Most flexible. The ESP module connects to home/phone-hotspot WiFi and posts
telemetry **directly to your cloud backend** at
`https://guardiandash-api.onrender.com/api/v1/telemetry`. No phone-bridge,
no bridge code, no laptop. Phone just shows whatever the backend has, even
if you close the app and reopen later.

### Wiring
```
STM32       ESP8266 / ESP32
─────       ─────────────────
GND  ────── GND
3.3V ────── VCC      (or 5V on ESP32, regulated)
PA2  ────── RX (UART)
PA3  ────── TX (UART) — optional
```

### Firmware on the ESP
A few lines of Arduino:
```cpp
WiFiClient client;
if (Serial.available()) {
  String line = Serial.readStringUntil('\n');  // "G:1.04,X:..."
  HTTPClient http;
  http.begin(client, "https://guardiandash-api.onrender.com/api/v1/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.POST("{\"raw\":\"" + line + "\"}");
}
```

### Backend endpoint
You'd add a `POST /api/v1/telemetry` route that takes the raw line, parses
it, and saves/broadcasts via Socket.io to connected app clients.

### Power
ESP modules are heavier (~80-200 mA peak). A 2000 mAh power bank gives ~10
hours of operation.

---

## My recommendation for your demo

**Option A (HC-05)** — cheapest, simplest, works tomorrow if you can buy
one in Egypt today. The mobile app would need a one-time **APK rebuild**
to include Bluetooth support, but after that it's a real standalone gadget.

For the academic report, mention all three architectures — shows you've
thought about scaling beyond the demo prototype.

## Cost summary

| Option | Module | Cost (EGP) | Time to demo |
|---|---|---|---|
| A | HC-05 | ~80 | 2h (buy + wire + APK rebuild) |
| B | HM-10 | ~150 | 3h (similar) |
| C | ESP-01 / ESP32 | 60–200 | 1 day (write ESP firmware too) |

## Power & enclosure for "in the box" deployment

Inside a 3D-printed or plastic project box:
- **Power**: USB-C powerbank → USB-C splitter? No — just route the powerbank's
  USB cable into the box through a grommet. Plug it into the Black Pill's USB.
- **Switch**: An inline USB switch ($2) so you can power-cycle without
  unplugging
- **Indicator**: The LCD already shows status, but a small power LED is nice
- **Mount**: Velcro or M3 standoffs to fix the STM32 to the case bottom

Make the case big enough that the LCD is visible through a window — the
on-board LCD doubles as a "this thing is alive" indicator even before the
phone connects.

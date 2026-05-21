# 🔌 UART output for the GuardianDash bridge

✅ **Already integrated.** The firmware in `Vehicle_BlackBox/` already prints
one CSV line per measurement over USART2 — no further code changes needed,
just **build and flash**.

## What was added

| File | Purpose |
|---|---|
| `Core/Inc/usart.h` | USART2 driver declarations |
| `Core/Src/usart.c` | Register-level USART2 init + transmit (no HAL UART driver needed) |
| `Core/Src/main.c` | Calls `Usart2_Init()` and emits a CSV line every 500ms |

## Wire format (matches `bridge/bridge.js` parser)
```
G:1.04,X:0.05,Y:-0.01,Z:1.00\r\n
```
115200 baud, 8-N-1.

## Pinout
| Function | STM32 pin |
|---|---|
| **TX2** (board → laptop) | **PA2** |
| **RX2** (laptop → board) | PA3 *(unused, reserved for future)* |

### If your board is a Nucleo
The Nucleo's on-board ST-Link bridges PA2/PA3 to a Virtual COM Port over the
same USB cable you use for flashing. You don't need any extra wiring —
plug the Nucleo into your laptop and the same USB enumerates as both
ST-Link debugger and a serial port.

### If your board is a Black Pill / generic F401
You need an external **USB-UART adapter** (CP2102, CH340, FT232 — any will
do, ~$3). Wire:
```
USB-UART     STM32
─────────    ──────
GND ──────── GND
RX  ──────── PA2  (TX2)
TX  ──────── PA3  (RX2 — optional)
```
Then plug the **adapter's** USB into the laptop — that's the COM port the
bridge will read from.

## Build & flash

1. Open `Vehicle_BlackBox/` in **STM32CubeIDE**
2. **Project ▸ Clean** (clears stale build artifacts)
3. **Project ▸ Build All**
   - You should see `usart.c` compile alongside the existing files
4. **Run ▸ Debug As ▸ STM32 C/C++ Application** to flash

## Verify it's working

Open any serial terminal (PuTTY / Tera Term / Arduino IDE's Serial Monitor)
at **115200 baud** on the STM32's COM port. You should see lines like:
```
[GuardianDash] Vehicle_BlackBox boot
G:1.02,X:0.05,Y:-0.01,Z:1.00
G:1.04,X:0.06,Y:-0.02,Z:1.01
G:1.03,X:0.04,Y:-0.01,Z:1.00
...
```

Shake the board → the G value should spike to 2g+ and the LCD flips to
`STATUS: UNSAFE` at the same moment the CSV line shows the spike.

If you see boot message but no measurement lines → MPU6050 init failed
(LCD also shows `MPU6050 ERROR / CHECK WIRING`). Fix the I²C wiring.

## Why register-level USART instead of HAL UART?
The original CubeMX project didn't include `stm32f4xx_hal_uart.c` in the
build. Regenerating the project from CubeMX with UART enabled would also
work, but it risks overwriting any custom edits in `main.c`. The 50-line
register driver in `usart.c` is self-contained, faster to build, and
doesn't require touching CubeMX.

## Run the bridge on the laptop

```bash
cd bridge
npm install              # one time
npm run list             # find the COM port
GD_SERIAL_PORT=COM3 npm start
```

Open the app on your phone → **Profile → Connect to Black Box** →
paste `http://<laptop-ip>:4001` → Connect. Live G-force from the
sensor will start driving the dashboard LCD mirror.

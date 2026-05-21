# 🔌 Vehicle_BlackBox — STM32 Firmware

The on-board firmware running on the **STM32F401** inside the car.

## What it does

1. Initializes the I²C1 bus
2. Calls `MPU6050_Init()` — wakes the IMU and verifies the WHO_AM_I register
3. Initializes the 16×2 I²C LCD and shows `BLACKBOX READY` then `MPU TESTING...`
4. Every 500 ms:
   - Reads accel X/Y/Z over I²C
   - Converts to g (raw ÷ 16384 for ±2g range)
   - Computes total G-force: `G = √(Ax² + Ay² + Az²)`
   - Writes `G:<value>` on line 1 of the LCD
   - Writes `STATUS: SAFE` if `G ≤ 1.50f`, otherwise `STATUS: UNSAFE`

## Hardware
| Component | Pins | Notes |
|---|---|---|
| STM32F401RCT6 | — | Main MCU |
| MPU6050 | I²C1 — PB6 (SCL), PB7 (SDA) | Address 0x68 (AD0 → GND) |
| 16×2 I²C LCD | Same I²C1 bus | PCF8574 backpack at 0x27 or 0x3F |
| 3.3 V rail | — | Shared with sensor + LCD logic |

## Building

Open `Vehicle_BlackBox/` in **STM32CubeIDE** → `Project ▸ Build All`.

Flash with ST-Link.

## Project layout
```
Vehicle_BlackBox/
├── Core/
│   ├── Inc/
│   │   ├── main.h, mpu6050.h, i2c-lcd.h, i2c.h, spi.h, gpio.h
│   │   └── stm32f4xx_hal_conf.h
│   ├── Src/
│   │   ├── main.c            ← The control loop
│   │   ├── mpu6050.c         ← MPU6050 driver (HAL-based)
│   │   ├── i2c-lcd.c         ← 16×2 LCD driver via I²C backpack
│   │   ├── i2c.c, spi.c, gpio.c
│   │   └── stm32f4xx_hal_msp.c, stm32f4xx_it.c
│   └── Startup/
│       └── startup_stm32f401rctx.s
└── Debug/                    ← build artifacts (.o, .elf, etc.)
```

## How it talks to the mobile app

✅ **Integrated.** The firmware streams live telemetry over **USART2 (PA2/PA3 @ 115200 baud)**
in CSV format:
```
G:1.04,X:0.05,Y:-0.01,Z:1.00
```

The `bridge/` Node.js script reads these lines over USB-serial and forwards them
to the mobile app via WebSocket. The app's **Live LCD Mirror** card on the
Dashboard then renders the same `G:1.23` / `STATUS: SAFE / UNSAFE` as the on-board
LCD — but driven by the real sensor in real time.

See [UART_BRIDGE.md](UART_BRIDGE.md) for the wiring, build and bridge-launch steps.

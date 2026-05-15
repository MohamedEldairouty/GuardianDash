# 🔌 GuardianDash Hardware

The physical black box that lives inside the vehicle.

## Bill of Materials
- STM32F4 (or Arduino fallback) microcontroller
- MPU6050 IMU (accelerometer + gyroscope)
- NEO-6M GPS module
- SIM800L GSM module (for eCall fallback)
- microSD card module (local trip backup)
- 12V → 5V buck converter

## Folders
- `stm32/` — embedded C / HAL firmware
- `schematics/` — circuit diagrams and PCB design

> 🚧 Firmware and schematics to be added in a later step.

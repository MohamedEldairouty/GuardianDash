# 🔌 Enabling UART output for the live bridge

The current firmware only drives the LCD. To stream live G-force into the
mobile app via the `bridge/` script, the firmware needs to also print one
CSV line per measurement over UART.

## 1. Add UART2 to the CubeMX `.ioc`

Open `Vehicle_BlackBox/Vehicle_BlackBox.ioc` in STM32CubeIDE and:
- Set **USART2** to **Asynchronous** mode (default pins PA2-TX / PA3-RX).
- Baud rate: **115200**, 8-N-1.
- Re-generate code (`Project ▸ Generate Code`).

This creates `MX_USART2_UART_Init()` and exposes `huart2`.

## 2. Add `#include "usart.h"` and a printf helper to `main.c`

```c
#include "usart.h"
#include <stdio.h>
#include <string.h>

static void uart_print(const char* s){
    HAL_UART_Transmit(&huart2, (uint8_t*)s, strlen(s), HAL_MAX_DELAY);
}
```

Don't forget `MX_USART2_UART_Init();` near the other `MX_..._Init()` calls.

## 3. In the main loop, print one CSV line per cycle

After `MPU6050_Read_Accel(...)`, add:

```c
char uart_buf[80];
snprintf(uart_buf, sizeof(uart_buf),
         "G:%.2f,X:%.2f,Y:%.2f,Z:%.2f\r\n",
         MPU6050.Gforce, MPU6050.Ax, MPU6050.Ay, MPU6050.Az);
uart_print(uart_buf);
```

> ⚠️ `snprintf` with `%f` requires float printf support. In STM32CubeIDE:
> `Project ▸ Properties ▸ C/C++ Build ▸ Settings ▸ MCU Settings` → check
> **"Use float with printf from newlib-nano"**.

## 4. Wire it up

| STM32 | Direction | USB-Serial adapter |
|---|---|---|
| PA2 (TX2) | → | RX |
| PA3 (RX2) | ← | TX |
| GND | ↔ | GND |

(If your board has a built-in USB-VCP / ST-Link VCP, you can route USART2
to that instead of an external adapter.)

## 5. Test

Open any serial terminal (PuTTY, Tera Term, `screen /dev/ttyUSB0 115200`)
at **115200 baud**. You should see lines like:
```
G:1.02,X:0.05,Y:-0.01,Z:1.00
G:1.04,X:0.06,Y:-0.02,Z:1.01
...
```

Then point the bridge at the same COM port (`bridge/README.md`).

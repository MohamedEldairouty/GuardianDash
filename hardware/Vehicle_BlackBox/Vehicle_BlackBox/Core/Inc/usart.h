/**
  ******************************************************************************
  * @file    usart.h
  * @brief   Minimal USART1 driver (register-level, no HAL UART required).
  *
  * Used to stream telemetry to the GuardianDash mobile app via an HM-10 BLE
  * module.
  *
  * Pins: PA9 = TX1, PA10 = RX1   (USART1 alternate function AF7)
  * Baud: 9600 8-N-1
  * Clock: assumes PCLK2 = 16 MHz (HSI, no PLL — matches SystemClock_Config in main.c)
  ******************************************************************************
  */

#ifndef __USART_H__
#define __USART_H__

#ifdef __cplusplus
extern "C" {
#endif

#include "main.h"

/** Initialize USART1 at 9600 8-N-1 on PA9/PA10 (AF7). */
void BtUart_Init(void);

/** Blocking transmit of a single byte. */
void BtUart_WriteByte(uint8_t b);

/** Blocking transmit of a null-terminated string. */
void BtUart_WriteString(const char *s);

#ifdef __cplusplus
}
#endif

#endif /* __USART_H__ */

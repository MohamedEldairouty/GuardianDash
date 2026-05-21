/**
  ******************************************************************************
  * @file    usart.h
  * @brief   Minimal USART2 driver (register-level, no HAL UART required).
  *
  * Used by the GuardianDash mobile app's USB-serial bridge.
  * Pins: PA2 = TX2, PA3 = RX2  (USART2 alternate function AF7)
  * Baud: 115200 8-N-1
  * Clock: assumes PCLK1 = 16 MHz (HSI, no PLL — matches SystemClock_Config in main.c)
  ******************************************************************************
  */

#ifndef __USART_H__
#define __USART_H__

#ifdef __cplusplus
extern "C" {
#endif

#include "main.h"

/** Initialize USART2 at 115200 8-N-1 on PA2/PA3 (AF7). */
void Usart2_Init(void);

/** Blocking transmit of a single byte. */
void Usart2_WriteByte(uint8_t b);

/** Blocking transmit of a null-terminated string. */
void Usart2_WriteString(const char *s);

#ifdef __cplusplus
}
#endif

#endif /* __USART_H__ */

/**
  ******************************************************************************
  * @file    usart.c
  * @brief   USART1 driver — register-level, no HAL UART module needed.
  *          Streams telemetry to the HM-10 BLE module → mobile app.
  *
  *   STM32 PA9  (TX1) ──► HM-10 RXD
  *   STM32 PA10 (RX1) ◄── HM-10 TXD     (optional, BLE → STM32 path)
  ******************************************************************************
  */

#include "usart.h"

/*
 * USART1 baud-rate divisor.
 * PCLK2 = 16 MHz (HSI, no PLL — matches SystemClock_Config in main.c)
 * OVER8 = 0
 *
 *   USARTDIV = fck / (16 * BAUD)
 *   BRR (16-bit) = round(USARTDIV * 16)
 *
 * Pre-computed values:
 *   115200 baud → BRR = 139    (0x008B)   ← USB-UART / serial terminals
 *   9600   baud → BRR = 1667   (0x0683)   ← HM-10 / HC-05 default
 */
#define USART1_BRR_115200_16MHZ  0x008B
#define USART1_BRR_9600_16MHZ    0x0683

#define USART1_BRR  USART1_BRR_9600_16MHZ

void BtUart_Init(void)
{
    /* 1. Enable peripheral clocks: GPIOA for PA9/PA10, and USART1. */
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_USART1_CLK_ENABLE();

    /* 2. Configure PA9 (TX) and PA10 (RX) as Alternate Function 7 (USART1). */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin       = GPIO_PIN_9 | GPIO_PIN_10;
    GPIO_InitStruct.Mode      = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull      = GPIO_PULLUP;
    GPIO_InitStruct.Speed     = GPIO_SPEED_FREQ_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART1;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* 3. Configure USART1 registers:
     *    CR1 = 0  -> 8-bit word, no parity, OVER8 = 0
     *    CR2 = 0  -> 1 stop bit
     *    CR3 = 0  -> no flow control
     *    BRR     -> baud rate divisor
     */
    USART1->CR1 = 0;
    USART1->CR2 = 0;
    USART1->CR3 = 0;
    USART1->BRR = USART1_BRR;

    /* 4. Enable transmitter and USART. */
    USART1->CR1 |= USART_CR1_TE;  /* TX enable */
    USART1->CR1 |= USART_CR1_UE;  /* USART enable */
}

void BtUart_WriteByte(uint8_t b)
{
    /* Wait until TX data register is empty. */
    while (!(USART1->SR & USART_SR_TXE)) { /* spin */ }
    USART1->DR = (uint16_t)(b & 0xFF);
}

void BtUart_WriteString(const char *s)
{
    if (s == NULL) return;
    while (*s) {
        BtUart_WriteByte((uint8_t)*s);
        s++;
    }
    /* Optional: wait for transmission complete before returning. */
    while (!(USART1->SR & USART_SR_TC)) { /* spin */ }
}

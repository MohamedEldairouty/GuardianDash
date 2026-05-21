/**
  ******************************************************************************
  * @file    usart.c
  * @brief   Minimal USART2 driver — register-level, no HAL UART module needed.
  *          Used by the GuardianDash mobile app's USB-serial bridge.
  ******************************************************************************
  */

#include "usart.h"

/*
 * USART2 baud-rate divisor.
 * PCLK1 = 16 MHz (HSI, no PLL — matches SystemClock_Config in main.c)
 * OVER8 = 0
 *
 *   USARTDIV = fck / (16 * BAUD)
 *   BRR (16-bit) = round(USARTDIV * 16)
 *
 * Pre-computed values:
 *   115200 baud → BRR = 139    (0x008B)   ← USB-UART / serial terminals
 *   9600   baud → BRR = 1667   (0x0683)   ← HM-10 / HC-05 default
 *
 * Pick ONE. The bridge.js script in /bridge auto-detects whatever the
 * firmware uses as long as the GD_BAUD env var matches.
 */
#define USART2_BRR_115200_16MHZ  0x008B
#define USART2_BRR_9600_16MHZ    0x0683

/* >>> Switch this to USART2_BRR_9600_16MHZ when wiring to HM-10 / HC-05 <<< */
#define USART2_BRR  USART2_BRR_9600_16MHZ

void Usart2_Init(void)
{
    /* 1. Enable peripheral clocks: GPIOA for PA2/PA3, and USART2. */
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_USART2_CLK_ENABLE();

    /* 2. Configure PA2 (TX) and PA3 (RX) as Alternate Function 7 (USART2). */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin       = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode      = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull      = GPIO_PULLUP;
    GPIO_InitStruct.Speed     = GPIO_SPEED_FREQ_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* 3. Configure USART2 registers:
     *    CR1 = 0  -> 8-bit word, no parity, OVER8 = 0
     *    CR2 = 0  -> 1 stop bit
     *    CR3 = 0  -> no flow control
     *    BRR     -> baud rate divisor
     */
    USART2->CR1 = 0;
    USART2->CR2 = 0;
    USART2->CR3 = 0;
    USART2->BRR = USART2_BRR;

    /* 4. Enable transmitter and USART. */
    USART2->CR1 |= USART_CR1_TE;  /* TX enable */
    USART2->CR1 |= USART_CR1_UE;  /* USART enable */
}

void Usart2_WriteByte(uint8_t b)
{
    /* Wait until TX data register is empty. */
    while (!(USART2->SR & USART_SR_TXE)) { /* spin */ }
    USART2->DR = (uint16_t)(b & 0xFF);
}

void Usart2_WriteString(const char *s)
{
    if (s == NULL) return;
    while (*s) {
        Usart2_WriteByte((uint8_t)*s);
        s++;
    }
    /* Optional: wait for transmission complete before returning. */
    while (!(USART2->SR & USART_SR_TC)) { /* spin */ }
}

/**
  ******************************************************************************
  * @file    usart.c
  * @brief   Minimal USART2 driver — register-level, no HAL UART module needed.
  *          Used by the GuardianDash mobile app's USB-serial bridge.
  ******************************************************************************
  */

#include "usart.h"

/*
 * USART2 baud-rate divisor for 115200 baud with PCLK1 = 16 MHz, OVER8 = 0.
 *   USARTDIV = fck / (16 * BAUD) = 16,000,000 / (16 * 115200) = 8.68
 *   BRR (16-bit) = round(USARTDIV * 16) = 139 = 0x8B
 *   Mantissa = 8, Fraction = 11  -> (8 << 4) | 11 = 0x8B
 */
#define USART2_BRR_115200_16MHZ  0x008B

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
    USART2->BRR = USART2_BRR_115200_16MHZ;

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

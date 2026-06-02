#include "UART.h"

/*
 *   USART1 register-level driver.
 *   Pins:  PA9 = TX, PA10 = RX  (alternate function AF7)
 *   Baud:  9600 8-N-1
 *   Clock: assumes PCLK2 = 16 MHz (HSI, no PLL).
 */

#define RCC_BASE     0x40023800UL
#define GPIOA_BASE   0x40020000UL
#define USART1_BASE  0x40011000UL

#define RCC_AHB1ENR  (*(volatile uint32*)(RCC_BASE + 0x30))
#define RCC_APB2ENR  (*(volatile uint32*)(RCC_BASE + 0x44))

#define GPIOA_MODER  (*(volatile uint32*)(GPIOA_BASE + 0x00))
#define GPIOA_OSPEED (*(volatile uint32*)(GPIOA_BASE + 0x08))
#define GPIOA_PUPDR  (*(volatile uint32*)(GPIOA_BASE + 0x0C))
#define GPIOA_AFRH   (*(volatile uint32*)(GPIOA_BASE + 0x24))

#define USART1_SR    (*(volatile uint32*)(USART1_BASE + 0x00))
#define USART1_DR    (*(volatile uint32*)(USART1_BASE + 0x04))
#define USART1_BRR   (*(volatile uint32*)(USART1_BASE + 0x08))
#define USART1_CR1   (*(volatile uint32*)(USART1_BASE + 0x0C))

/*
 *   Baud divisor for 9600 baud at 16 MHz PCLK2, OVER8 = 0:
 *     USARTDIV = 16,000,000 / (16 * 9600) = 104.166...
 *     Mantissa = 104, Fraction = round(0.166 * 16) = 3
 *     BRR = (104 << 4) | 3 = 0x683 = 1667
 */
#define USART1_BRR_9600_16MHZ  0x0683

void UART_Init(void)
{
    /* 1. Clocks: GPIOA on AHB1, USART1 on APB2. */
    RCC_AHB1ENR |= (1U << 0);   /* GPIOAEN */
    RCC_APB2ENR |= (1U << 4);   /* USART1EN */

    /* 2. PA9 = AF mode (10), PA10 = AF mode (10). */
    GPIOA_MODER &= ~((3U << (9 * 2)) | (3U << (10 * 2)));
    GPIOA_MODER |=  ((2U << (9 * 2)) | (2U << (10 * 2)));

    /* High speed for both pins. */
    GPIOA_OSPEED |= (3U << (9 * 2)) | (3U << (10 * 2));

    /* Pull-up on RX is nice to avoid noise. */
    GPIOA_PUPDR &= ~((3U << (9 * 2)) | (3U << (10 * 2)));
    GPIOA_PUPDR |=  (1U << (10 * 2));   /* pull-up on PA10 */

    /* 3. AF7 for PA9 and PA10 in AFRH (bits 4..7 for PA9, 8..11 for PA10). */
    GPIOA_AFRH &= ~((0xFU << ((9  - 8) * 4)) | (0xFU << ((10 - 8) * 4)));
    GPIOA_AFRH |=  ((7U   << ((9  - 8) * 4)) | (7U   << ((10 - 8) * 4)));

    /* 4. USART config. */
    USART1_CR1 = 0;                       /* reset */
    USART1_BRR = USART1_BRR_9600_16MHZ;
    USART1_CR1 |= (1U << 3);              /* TE — transmitter enable */
    USART1_CR1 |= (1U << 2);              /* RE — receiver enable    */
    USART1_CR1 |= (1U << 13);             /* UE — USART enable       */
}

void UART_SendChar(uint8 c)
{
    while (!(USART1_SR & (1U << 7))) { /* spin until TXE */ }
    USART1_DR = (uint32)c;
}

void UART_SendString(const char* s)
{
    if (s == 0) return;
    while (*s) {
        UART_SendChar((uint8)*s);
        s++;
    }
    /* Wait for transmission complete so the buffer isn't truncated. */
    while (!(USART1_SR & (1U << 6))) { /* spin until TC */ }
}

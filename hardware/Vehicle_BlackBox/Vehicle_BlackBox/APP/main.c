/*
 *  MINIMAL UART SMOKE TEST
 *  =======================
 *  Goal: prove that the STM32 → HM-10 → phone path works at the byte level.
 *  No MPU6050. No LCD. No motors. Just LED blink + raw UART output.
 *
 *  If this works, swap back to the full main.c — that proves UART is fine
 *  and the original main was hanging in MPU/LCD init.
 *
 *  If this DOESN'T work after a confirmed flash:
 *      - HM-10 RX wire isn't actually on PA9 (loose breadboard)
 *      - HM-10 was AT-commanded to a non-9600 baud
 *      - HM-10 module is faulty
 *      - GND not common between STM32 and HM-10
 */

#include "../Inc/Common/Std_Types.h"

/* === STM32F401 register base addresses === */
#define RCC_AHB1ENR  (*(volatile uint32*)0x40023830UL)
#define RCC_APB2ENR  (*(volatile uint32*)0x40023844UL)

#define GPIOA_MODER  (*(volatile uint32*)0x40020000UL)
#define GPIOA_AFRH   (*(volatile uint32*)0x40020024UL)

#define GPIOC_MODER  (*(volatile uint32*)0x40020800UL)
#define GPIOC_ODR    (*(volatile uint32*)0x40020814UL)

#define USART1_SR    (*(volatile uint32*)0x40011000UL)
#define USART1_DR    (*(volatile uint32*)0x40011004UL)
#define USART1_BRR   (*(volatile uint32*)0x40011008UL)
#define USART1_CR1   (*(volatile uint32*)0x4001100CUL)

static void delay(volatile uint32 n){ while(n--) __asm__("nop"); }

static void uart_send_char(uint8 c){
    while (!(USART1_SR & (1U << 7))) {}    /* wait TXE */
    USART1_DR = (uint32)c;
}

static void uart_send_string(const char *s){
    while (*s) uart_send_char((uint8)*s++);
    while (!(USART1_SR & (1U << 6))) {}    /* wait TC */
}

int main(void){
    /* ---------- 1. Clocks ---------- */
    RCC_AHB1ENR |= (1U << 0);              /* GPIOA */
    RCC_AHB1ENR |= (1U << 2);              /* GPIOC (for the on-board LED on PC13) */
    RCC_APB2ENR |= (1U << 4);              /* USART1 */

    /* ---------- 2. PC13 as output (most Black Pills have an LED here) ---------- */
    GPIOC_MODER &= ~(3U << (13 * 2));
    GPIOC_MODER |=  (1U << (13 * 2));

    /* ---------- 3. PA9 (TX1), PA10 (RX1) as Alternate Function 7 ---------- */
    GPIOA_MODER &= ~((3U << (9 * 2)) | (3U << (10 * 2)));
    GPIOA_MODER |=  ((2U << (9 * 2)) | (2U << (10 * 2)));   /* AF mode */
    GPIOA_AFRH  &= ~((0xFU << ((9  - 8) * 4)) | (0xFU << ((10 - 8) * 4)));
    GPIOA_AFRH  |=  ((7U   << ((9  - 8) * 4)) | (7U   << ((10 - 8) * 4)));  /* AF7 */

    /* ---------- 4. USART1: 9600 baud @ 16 MHz HSI, 8-N-1, TX enabled ---------- */
    USART1_CR1 = 0;
    USART1_BRR = 0x683;                    /* round(16e6 / 9600) */
    USART1_CR1 |= (1U << 3);               /* TE */
    USART1_CR1 |= (1U << 13);              /* UE */

    delay(800000);                         /* HM-10 settle */

    uart_send_string("\r\n=========================\r\n");
    uart_send_string("MINIMAL UART TEST RUNNING\r\n");
    uart_send_string("=========================\r\n");

    uint32 counter = 0;
    while (1) {
        /* Toggle PC13 LED so we know the loop is alive even without UART. */
        GPIOC_ODR ^= (1U << 13);

        /* Send a recognizable line to the phone every loop. */
        char buf[64];
        /* Manual integer-to-string to avoid pulling in <stdio.h>/snprintf. */
        char *p = buf;
        const char *prefix = "G:100,STATUS:SAFE,N:";
        while (*prefix) *p++ = *prefix++;

        /* Append counter as decimal. */
        if (counter == 0) { *p++ = '0'; }
        else {
            char digs[12]; int n = 0;
            uint32 v = counter;
            while (v > 0) { digs[n++] = '0' + (v % 10); v /= 10; }
            while (n--) *p++ = digs[n];
        }
        *p++ = '\r'; *p++ = '\n'; *p = '\0';
        uart_send_string(buf);

        counter++;
        delay(3000000);                    /* ~roughly 1 second @ 16 MHz */
    }
}

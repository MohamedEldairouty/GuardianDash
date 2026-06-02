/*
 *  STM32 → HM-10 → GuardianDash app
 *  Minimal, no I2C / no LCD / no MPU.
 *  Sends a parser-bulletproof CSV that EVERY version of the BLE parser
 *  recognizes — explicit AX/AY/AZ so isCents detection always triggers.
 *  Values wobble slightly so the dashboard looks alive.
 */

#include "../Inc/Common/Std_Types.h"

/* === Register addresses (STM32F401) === */
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

static void u_send_char(uint8 c){
    while (!(USART1_SR & (1U << 7))) {}
    USART1_DR = (uint32)c;
}

static void u_send_str(const char *s){
    while (*s) u_send_char((uint8)*s++);
    while (!(USART1_SR & (1U << 6))) {}
}

/* Append signed integer, returns pointer to terminator. */
static char* append_int(char *p, int32 v){
    if (v < 0) { *p++ = '-'; v = -v; }
    char digs[12]; int n = 0;
    if (v == 0) { *p++ = '0'; return p; }
    while (v > 0) { digs[n++] = (char)('0' + (uint32)(v % 10)); v /= 10; }
    while (n--) *p++ = digs[n];
    return p;
}

int main(void){
    /* Clocks */
    RCC_AHB1ENR |= (1U << 0);             /* GPIOA */
    RCC_AHB1ENR |= (1U << 2);             /* GPIOC (PC13 LED) */
    RCC_APB2ENR |= (1U << 4);             /* USART1 */

    /* PC13 output (Black Pill LED) */
    GPIOC_MODER &= ~(3U << (13 * 2));
    GPIOC_MODER |=  (1U << (13 * 2));

    /* PA9 / PA10 → AF7 USART1 */
    GPIOA_MODER &= ~((3U << 18) | (3U << 20));
    GPIOA_MODER |=  ((2U << 18) | (2U << 20));
    GPIOA_AFRH  &= ~((0xFU << 4) | (0xFU << 8));
    GPIOA_AFRH  |=  ((7U   << 4) | (7U   << 8));

    /* USART1: 9600 baud @ 16 MHz HSI */
    USART1_CR1 = 0;
    USART1_BRR = 0x683;
    USART1_CR1 |= (1U << 3);              /* TE */
    USART1_CR1 |= (1U << 13);             /* UE */

    delay(800000);

    u_send_str("\r\nBLACKBOX READY\r\n");

    int32 wobble = 0;
    int32 dir = 1;
    int32 frame_no = 0;

    while (1) {
        GPIOC_ODR ^= (1U << 13);          /* heartbeat LED */

        /* Wobble az between 95 and 105 cg (0.95–1.05 g) so the dashboard
         * looks alive instead of stuck at exactly 1.00. */
        wobble += dir;
        if (wobble > 5)  dir = -1;
        if (wobble < -5) dir =  1;
        int32 az_cg = 100 + wobble;
        int32 g_cg  = 100 + (wobble < 0 ? -wobble : wobble);  /* abs */
        int32 ax_cg = wobble / 2;
        int32 ay_cg = -wobble / 3;

        /* Build line: AX:n,AY:n,AZ:n,G:n,STATUS:SAFE\r\n */
        char buf[80];
        char *p = buf;
        const char *t;

        t = "AX:";   while (*t) *p++ = *t++;
        p = append_int(p, ax_cg);
        t = ",AY:";  while (*t) *p++ = *t++;
        p = append_int(p, ay_cg);
        t = ",AZ:";  while (*t) *p++ = *t++;
        p = append_int(p, az_cg);
        t = ",G:";   while (*t) *p++ = *t++;
        p = append_int(p, g_cg);
        t = ",STATUS:SAFE\r\n"; while (*t) *p++ = *t++;
        *p = '\0';

        u_send_str(buf);

        frame_no++;
        delay(1200000);                   /* ~5 Hz */
    }
}

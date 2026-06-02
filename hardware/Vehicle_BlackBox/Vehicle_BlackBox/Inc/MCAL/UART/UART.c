#include "../../Common/Std_Types.h"

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

#define USART1_BAUD_9600_16MHZ 0x0683

void UART_Init(void){
    // 1. Enable GPIOA clock and USART1 clock
    RCC_AHB1ENR |= (1 << 0);  // GPIOAEN
    RCC_APB2ENR |= (1 << 4);  // USART1EN

    // 2. Configure PA9=TX, PA10=RX to AF7
    GPIOA_MODER &= ~((3U << (9*2)) | (3U << (10*2)));
    GPIOA_MODER |= ((2U << (9*2)) | (2U << (10*2))); // AF mode
    GPIOA_OSPEED |= (3U << (9*2)) | (3U << (10*2)); // high speed
    GPIOA_PUPDR &= ~((3U << (9*2)) | (3U << (10*2)));
    GPIOA_PUPDR |= (1U << (10*2)); // pull-up RX

    GPIOA_AFRH &= ~((0xF << ((9-8)*4)) | (0xF << ((10-8)*4)));
    GPIOA_AFRH |= ((7 << ((9-8)*4)) | (7 << ((10-8)*4))); // AF7

    // 3. Set baud rate and enable USART1
    USART1_BRR = USART1_BAUD_9600_16MHZ;
    USART1_CR1 = (1<<13) | (1<<3) | (1<<2); // UE + TE + RE
}

void UART_SendChar(uint8 c){
    while(!(USART1_SR & (1<<7))); // wait TXE
    USART1_DR = c;
}

void UART_SendString(const char* s){
    while(*s) UART_SendChar((uint8)*s++);
    while(!(USART1_SR & (1<<6))); // wait TC
}

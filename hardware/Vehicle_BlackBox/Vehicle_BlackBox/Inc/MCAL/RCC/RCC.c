#include "RCC.h"

#define RCC_BASE 0x40023800UL
#define RCC_AHB1ENR_OFFSET 0x30
#define RCC_APB1ENR_OFFSET 0x40
#define RCC_APB2ENR_OFFSET 0x44

#define RCC_AHB1ENR (*((volatile uint32*)(RCC_BASE + RCC_AHB1ENR_OFFSET)))
#define RCC_APB1ENR (*((volatile uint32*)(RCC_BASE + RCC_APB1ENR_OFFSET)))
#define RCC_APB2ENR (*((volatile uint32*)(RCC_BASE + RCC_APB2ENR_OFFSET)))

#define TIMER_2 2
#define TIMER_3 3
#define TIMER_4 4
#define TIMER_5 5

#define PORT_A 0
#define PORT_B 1
#define PORT_C 2
#define PORT_D 3
#define PORT_E 4
#define PORT_H 5

void RCC_EnableGPIO(uint8 port){
    if(port != PORT_H) RCC_AHB1ENR |= (1 << port);
    else RCC_AHB1ENR |= (1 << 7);
}

void RCC_EnableTimer(uint8 TimerId){
    if(TimerId == TIMER_2) RCC_APB1ENR |= (1 << 0);
    else if(TimerId == TIMER_3) RCC_APB1ENR |= (1 << 1);
    else if(TimerId == TIMER_4) RCC_APB1ENR |= (1 << 2);
    else if(TimerId == TIMER_5) RCC_APB1ENR |= (1 << 3);
}

void RCC_EnableADC1(){
    RCC_APB2ENR |= (1 << 8);
}

#include "Timer.h"

#define TIM2_BASE 0x40000000UL
#define TIM3_BASE 0x40000400UL
#define TIM4_BASE 0x40000800UL
#define TIM5_BASE 0x40000C00UL

#define TIM_CR1_OFFSET 0x00
#define TIM_SR_OFFSET  0x10
#define TIM_PSC_OFFSET 0x28
#define TIM_ARR_OFFSET 0x2C
#define TIM_CNT_OFFSET 0x24

#define TIM_CR1(timer) (*((volatile uint32*)((timer)+TIM_CR1_OFFSET)))
#define TIM_SR(timer)  (*((volatile uint32*)((timer)+TIM_SR_OFFSET)))
#define TIM_PSC(timer) (*((volatile uint32*)((timer)+TIM_PSC_OFFSET)))
#define TIM_ARR(timer) (*((volatile uint32*)((timer)+TIM_ARR_OFFSET)))
#define TIM_CNT(timer) (*((volatile uint32*)((timer)+TIM_CNT_OFFSET)))

uint32 GetTimerAddress(uint8 TimerId){
    switch(TimerId){
        case TIMER_2: return TIM2_BASE;
        case TIMER_3: return TIM3_BASE;
        case TIMER_4: return TIM4_BASE;
        case TIMER_5: return TIM5_BASE;
        default: return TIM2_BASE;
    }
}

void Timer_Init(Timer_ConfigType ConfigPtr){
    uint32 timer = GetTimerAddress(ConfigPtr.TimerId);
    TIM_CR1(timer) &= ~1;
    TIM_PSC(timer) = ConfigPtr.Prescaler;
    TIM_ARR(timer) = ConfigPtr.AutoReload;
    TIM_CNT(timer) = 0;
    TIM_CR1(timer) |= 1;
}

void Timer_Start(uint8 TimerId){ TIM_CR1(GetTimerAddress(TimerId)) |= 1; }
void Timer_Stop(uint8 TimerId){ TIM_CR1(GetTimerAddress(TimerId)) &= ~1; }
uint8 Timer_GetFlag(uint8 TimerId){ return (TIM_SR(GetTimerAddress(TimerId)) & 1); }
void Timer_ClearFlag(uint8 TimerId){ TIM_SR(GetTimerAddress(TimerId)) &= ~1; }

void Timer_DelayUs(uint32 us){
    volatile uint32 i;
    while(us--){
        for(i=0;i<16;i++);
    }
}

void Timer_DelayMs(uint32 ms){
    while(ms--){
        Timer_DelayUs(1000);
    }
}

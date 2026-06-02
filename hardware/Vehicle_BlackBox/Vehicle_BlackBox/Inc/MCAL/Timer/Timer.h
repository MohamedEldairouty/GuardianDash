#ifndef TIMER_H_
#define TIMER_H_

#include "../../Common/Std_Types.h"

#define TIMER_2 2
#define TIMER_3 3
#define TIMER_4 4
#define TIMER_5 5

typedef struct{
    uint8 TimerId;
    uint32 Prescaler;
    uint32 AutoReload;
} Timer_ConfigType;

void Timer_Init(Timer_ConfigType ConfigPtr);
void Timer_Start(uint8 TimerId);
void Timer_Stop(uint8 TimerId);
uint8 Timer_GetFlag(uint8 TimerId);
void Timer_ClearFlag(uint8 TimerId);

// Delays
void Timer_DelayUs(uint32 us);
void Timer_DelayMs(uint32 ms);

#endif

#ifndef MCAL_ADC_ADC_H_
#define MCAL_ADC_ADC_H_

#include "../../Common/Macros.h"
#include "../../Common/Std_Types.h"

typedef enum{
    CHANNEL_0, CHANNEL_1, CHANNEL_2, CHANNEL_3,
    CHANNEL_4, CHANNEL_5, CHANNEL_6, CHANNEL_7,
    CHANNEL_8, CHANNEL_9
} ADC_Channel;

void ADC_Init();
void ADC_SelectChannel(ADC_Channel channel);
void ADC_Start();
uint16 ADC_Read();

#endif

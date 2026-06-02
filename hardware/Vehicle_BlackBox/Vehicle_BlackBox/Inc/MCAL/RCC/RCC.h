#ifndef MCAL_RCC_RCC_H_
#define MCAL_RCC_RCC_H_

#include "../../Common/Std_Types.h"
#include "../../Common/Macros.h"

void RCC_EnableGPIO(uint8 port);
void RCC_EnableTimer(uint8 TimerId);
void RCC_EnableADC1();

#endif

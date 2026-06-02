#ifndef _UART_H_
#define _UART_H_

#include "../../Common/Std_Types.h"

/* USART1 on PA9 (TX) / PA10 (RX), 9600 baud — matches HM-10 default. */

void UART_Init(void);
void UART_SendChar(uint8 c);
void UART_SendString(const char* s);

#endif

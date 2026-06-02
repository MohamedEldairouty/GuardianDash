#ifndef MCAL_DIO_DIO_H_
#define MCAL_DIO_DIO_H_

#include "../../Common/Std_Types.h"
#include "../../Common/Macros.h"

#define PORT_A 0
#define PORT_B 1
#define PORT_C 2
#define PORT_D 3
#define PORT_E 4
#define PORT_H 5

#define PIN_0 0
#define PIN_1 1
#define PIN_2 2
#define PIN_3 3
#define PIN_4 4
#define PIN_5 5
#define PIN_6 6
#define PIN_7 7
#define PIN_8 8
#define PIN_9 9
#define PIN_10 10
#define PIN_11 11
#define PIN_12 12
#define PIN_13 13
#define PIN_14 14
#define PIN_15 15

typedef enum{
    DIR_INPUT,
    DIR_OUTPUT,
    DIR_AF,
    DIR_ANALOG
} Dio_Direction;

typedef uint8 Dio_ChannelType;
typedef uint8 Dio_PortLevelType;

void ApplyDir(uint8 portName, uint8 pinNumber , Dio_Direction pinDir);
uint8 Dio_ReadChannel(uint8 Port, Dio_ChannelType ChannelId);
void Dio_WriteChannel(uint8 PortId, Dio_ChannelType ChannelId, Dio_PortLevelType Level);
void Dio_FlipChannel(uint8 PortId, Dio_ChannelType ChannelId);

#endif

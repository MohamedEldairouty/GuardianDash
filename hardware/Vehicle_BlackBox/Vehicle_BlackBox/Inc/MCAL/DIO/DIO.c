#include "DIO.h"

#define GPIOA_BASE 0x40020000UL
#define GPIOB_BASE 0x40020400UL
#define GPIOC_BASE 0x40020800UL
#define GPIOD_BASE 0x40020C00UL
#define GPIOE_BASE 0x40021000UL
#define GPIOH_BASE 0x40021C00UL

#define MODER_OFFSET 0x00
#define IDR_OFFSET   0x10
#define BSRR_OFFSET  0x18

#define GPIO_MODER(port) (*((volatile uint32*)(port + MODER_OFFSET)))
#define GPIO_IDR(port)   (*((volatile uint32*)(port + IDR_OFFSET)))
#define GPIO_BSRR(port)  (*((volatile uint32*)(port + BSRR_OFFSET)))

uint32 GetPortAddress(uint8 port){
    switch(port){
        case PORT_A: return GPIOA_BASE;
        case PORT_B: return GPIOB_BASE;
        case PORT_C: return GPIOC_BASE;
        case PORT_D: return GPIOD_BASE;
        case PORT_E: return GPIOE_BASE;
        case PORT_H: return GPIOH_BASE;
    }
    return GPIOA_BASE;
}

void ApplyDir(uint8 portName, uint8 pinNumber , Dio_Direction pinDir){
    uint32 port = GetPortAddress(portName);
    if(pinDir == DIR_INPUT) GPIO_MODER(port) &= ~(3 << (pinNumber*2));
    else if(pinDir == DIR_OUTPUT){
        GPIO_MODER(port) &= ~(3 << (pinNumber*2));
        GPIO_MODER(port) |= (1 << (pinNumber*2));
    }
    else if(pinDir == DIR_AF){
        GPIO_MODER(port) &= ~(3 << (pinNumber*2));
        GPIO_MODER(port) |= (2 << (pinNumber*2));
    }
    else if(pinDir == DIR_ANALOG){
        GPIO_MODER(port) &= ~(3 << (pinNumber*2));
        GPIO_MODER(port) |= (3 << (pinNumber*2));
    }
}

uint8 Dio_ReadChannel(uint8 Port, Dio_ChannelType ChannelId){
    uint32 port = GetPortAddress(Port);
    return GET_BIT(GPIO_IDR(port), ChannelId);
}

void Dio_WriteChannel(uint8 PortId, Dio_ChannelType ChannelId, Dio_PortLevelType Level){
    uint32 port = GetPortAddress(PortId);
    if(Level == STD_HIGH) SET_BIT(GPIO_BSRR(port), ChannelId);
    else SET_BIT(GPIO_BSRR(port), ChannelId+16);
}

void Dio_FlipChannel(uint8 PortId, Dio_ChannelType ChannelId){
    if(Dio_ReadChannel(PortId, ChannelId)) Dio_WriteChannel(PortId, ChannelId, STD_LOW);
    else Dio_WriteChannel(PortId, ChannelId, STD_HIGH);
}

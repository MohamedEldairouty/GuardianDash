#include "I2C.h"
#include "../RCC/RCC.h"
#include "../DIO/DIO.h"

void I2C_Init(void){
    RCC_EnableGPIO(PORT_B);
    ApplyDir(PORT_B,PIN_6,DIR_AF);
    ApplyDir(PORT_B,PIN_7,DIR_AF);
}

uint8 I2C_Write(uint8 dev_addr, uint8 reg_addr, uint8 data){ return 0; }
uint8 I2C_Read(uint8 dev_addr, uint8 reg_addr){ return 0; }

#ifndef MCAL_I2C_I2C_H_
#define MCAL_I2C_I2C_H_

#include "../../Common/Std_Types.h"

void I2C_Init(void);
uint8 I2C_Write(uint8 dev_addr, uint8 reg_addr, uint8 data);
uint8 I2C_Read(uint8 dev_addr, uint8 reg_addr);

#endif

#ifndef I2C_H_
#define I2C_H_

#include "../../Common/Std_Types.h"

void I2C_Init(void);
void I2C_Start(void);
void I2C_Stop(void);
uint8 I2C_Write(uint8 dev_addr, uint8 reg_addr, uint8 data);
uint8 I2C_Read(uint8 dev_addr, uint8 reg_addr);

#endif

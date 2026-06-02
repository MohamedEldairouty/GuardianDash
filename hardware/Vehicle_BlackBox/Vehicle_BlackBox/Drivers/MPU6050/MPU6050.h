#ifndef MPU6050_H_
#define MPU6050_H_

#include "../../Inc/MCAL/I2C/I2C.h"
#include "../../Inc/Common/Std_Types.h"
void MPU6050_Init(void);
void MPU6050_Read(int16* ax,int16* ay,int16* az,int16* gx,int16* gy,int16* gz);

#endif

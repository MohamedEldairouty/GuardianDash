#ifndef MPU6050_H
#define MPU6050_H

#include "main.h"

#define MPU6050_ADDR 0xD0

typedef struct
{
    int16_t Accel_X_RAW;
    int16_t Accel_Y_RAW;
    int16_t Accel_Z_RAW;

    float Ax;
    float Ay;
    float Az;

    float Gforce;
} MPU6050_t;

uint8_t MPU6050_Init(I2C_HandleTypeDef *I2Cx);
void MPU6050_Read_Accel(I2C_HandleTypeDef *I2Cx, MPU6050_t *DataStruct);

#endif

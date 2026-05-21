#ifndef ADXL345_H
#define ADXL345_H

#include "main.h"

#define ADXL345_ADDR        (0x53 << 1)
#define ADXL345_DEVID       0x00
#define ADXL345_POWER_CTL   0x2D
#define ADXL345_DATA_FORMAT 0x31
#define ADXL345_DATAX0      0x32

typedef struct
{
    int16_t X_RAW;
    int16_t Y_RAW;
    int16_t Z_RAW;

    float Ax;
    float Ay;
    float Az;

    float Gforce;
} ADXL345_t;

uint8_t ADXL345_Init(I2C_HandleTypeDef *I2Cx);
void ADXL345_Read_Accel(I2C_HandleTypeDef *I2Cx, ADXL345_t *DataStruct);

#endif

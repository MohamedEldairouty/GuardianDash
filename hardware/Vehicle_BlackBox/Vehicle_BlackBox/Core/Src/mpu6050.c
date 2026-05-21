#include "mpu6050.h"
#include <math.h>

#define PWR_MGMT_1_REG 0x6B
#define ACCEL_XOUT_H   0x3B
#define ACCEL_CONFIG   0x1C
#define WHO_AM_I_REG   0x75

uint8_t MPU6050_Init(I2C_HandleTypeDef *I2Cx)
{
    uint8_t check = 0;
    uint8_t Data = 0;

    HAL_Delay(100);

    if (HAL_I2C_IsDeviceReady(I2Cx, MPU6050_ADDR, 3, 1000) != HAL_OK)
    {
        return 1;
    }

    HAL_I2C_Mem_Read(I2Cx, MPU6050_ADDR, WHO_AM_I_REG, 1, &check, 1, 1000);

    if (check != 0x68 && check != 0x70)
    {
        return 1;
    }

    Data = 0x00;
    HAL_I2C_Mem_Write(I2Cx, MPU6050_ADDR, PWR_MGMT_1_REG, 1, &Data, 1, 1000);

    Data = 0x00;
    HAL_I2C_Mem_Write(I2Cx, MPU6050_ADDR, ACCEL_CONFIG, 1, &Data, 1, 1000);

    return 0;
}

void MPU6050_Read_Accel(I2C_HandleTypeDef *I2Cx, MPU6050_t *DataStruct)
{
    uint8_t Rec_Data[6];

    HAL_I2C_Mem_Read(I2Cx, MPU6050_ADDR, ACCEL_XOUT_H, 1, Rec_Data, 6, 1000);

    DataStruct->Accel_X_RAW = (int16_t)(Rec_Data[0] << 8 | Rec_Data[1]);
    DataStruct->Accel_Y_RAW = (int16_t)(Rec_Data[2] << 8 | Rec_Data[3]);
    DataStruct->Accel_Z_RAW = (int16_t)(Rec_Data[4] << 8 | Rec_Data[5]);

    DataStruct->Ax = DataStruct->Accel_X_RAW / 16384.0f;
    DataStruct->Ay = DataStruct->Accel_Y_RAW / 16384.0f;
    DataStruct->Az = DataStruct->Accel_Z_RAW / 16384.0f;

    DataStruct->Gforce = sqrtf(
        (DataStruct->Ax * DataStruct->Ax) +
        (DataStruct->Ay * DataStruct->Ay) +
        (DataStruct->Az * DataStruct->Az)
    );
}

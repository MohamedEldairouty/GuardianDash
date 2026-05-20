#include "adxl.h"
#include <math.h>

uint8_t ADXL345_Init(I2C_HandleTypeDef *I2Cx)
{
    uint8_t check = 0;
    uint8_t data = 0;

    HAL_Delay(100);

    if (HAL_I2C_IsDeviceReady(I2Cx, ADXL345_ADDR, 3, 1000) != HAL_OK)
    {
        return 1;
    }

    HAL_I2C_Mem_Read(I2Cx, ADXL345_ADDR, ADXL345_DEVID, 1, &check, 1, 1000);

    if (check != 0xE5)
    {
        return 1;
    }

    data = 0x0B;
    HAL_I2C_Mem_Write(I2Cx, ADXL345_ADDR, ADXL345_DATA_FORMAT, 1, &data, 1, 1000);

    data = 0x08;
    HAL_I2C_Mem_Write(I2Cx, ADXL345_ADDR, ADXL345_POWER_CTL, 1, &data, 1, 1000);

    return 0;
}

void ADXL345_Read_Accel(I2C_HandleTypeDef *I2Cx, ADXL345_t *DataStruct)
{
    uint8_t Rec_Data[6];

    HAL_I2C_Mem_Read(I2Cx, ADXL345_ADDR, ADXL345_DATAX0, 1, Rec_Data, 6, 1000);

    DataStruct->X_RAW = (int16_t)((Rec_Data[1] << 8) | Rec_Data[0]);
    DataStruct->Y_RAW = (int16_t)((Rec_Data[3] << 8) | Rec_Data[2]);
    DataStruct->Z_RAW = (int16_t)((Rec_Data[5] << 8) | Rec_Data[4]);

    DataStruct->Ax = DataStruct->X_RAW * 0.004f;
    DataStruct->Ay = DataStruct->Y_RAW * 0.004f;
    DataStruct->Az = DataStruct->Z_RAW * 0.004f;

    DataStruct->Gforce = sqrtf(
        (DataStruct->Ax * DataStruct->Ax) +
        (DataStruct->Ay * DataStruct->Ay) +
        (DataStruct->Az * DataStruct->Az)
    );
}

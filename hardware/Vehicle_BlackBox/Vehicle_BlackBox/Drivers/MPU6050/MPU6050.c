#include "MPU6050.h"

#define MPU_ADDR 0x68

void MPU6050_Init(void){
    I2C_Write(MPU_ADDR,0x6B,0x00); // Wake up device
}

void MPU6050_Read(int16* ax,int16* ay,int16* az,int16* gx,int16* gy,int16* gz){
    uint8 data[14];
    for(int i=0;i<14;i++) data[i] = I2C_Read(MPU_ADDR,0x3B+i);
    *ax = (data[0]<<8)|data[1];
    *ay = (data[2]<<8)|data[3];
    *az = (data[4]<<8)|data[5];
    *gx = (data[8]<<8)|data[9];
    *gy = (data[10]<<8)|data[11];
    *gz = (data[12]<<8)|data[13];
}

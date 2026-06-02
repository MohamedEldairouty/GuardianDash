#include "MPU6050.h"

/* AD0 → GND gives 0x68, AD0 → 3V3 gives 0x69.
 * Auto-detect at init so a loose AD0 wire doesn't silently break us. */
static uint8 mpu_addr = 0x68;

static uint8 mpu_responds(uint8 addr){
    uint8 who = I2C_Read(addr, 0x75);
    return (who == 0x68) || (who == 0x70) || (who == 0x71) || (who == 0x73);
}

void MPU6050_Init(void){
    if (mpu_responds(0x68))      mpu_addr = 0x68;
    else if (mpu_responds(0x69)) mpu_addr = 0x69;

    /* Wake from sleep + set accel range to ±2g. */
    I2C_Write(mpu_addr, 0x6B, 0x00);
    I2C_Write(mpu_addr, 0x1C, 0x00);
}

void MPU6050_Read(int16* ax,int16* ay,int16* az,int16* gx,int16* gy,int16* gz){
    uint8 data[14];
    for(int i=0;i<14;i++) data[i] = I2C_Read(mpu_addr, 0x3B + i);
    *ax = (int16)((data[0]<<8)|data[1]);
    *ay = (int16)((data[2]<<8)|data[3]);
    *az = (int16)((data[4]<<8)|data[5]);
    *gx = (int16)((data[8]<<8)|data[9]);
    *gy = (int16)((data[10]<<8)|data[11]);
    *gz = (int16)((data[12]<<8)|data[13]);
}

uint8 MPU6050_GetAddress(void){ return mpu_addr; }

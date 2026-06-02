#include <stdio.h>
#include "../Inc/Common/Std_Types.h"
#include "../Inc/MCAL/DIO/DIO.h"
#include "../Inc/MCAL/RCC/RCC.h"
#include "../Inc/MCAL/Timer/Timer.h"
#include "../Inc/MCAL/I2C/I2C.h"
#include "../Drivers/LCD/LCD.h"
#include "../Drivers/MPU6050/MPU6050.h"

#define LED_PIN PIN_13
#define LED_PORT PORT_C

#define CRASH_THRESHOLD 2000

#define ENA PIN_12
#define IN1 PIN_13
#define IN2 PIN_14
#define ENB PIN_15
#define IN3 PIN_8
#define IN4 PIN_9
#define MOTOR_PORT PORT_B

typedef struct { int16 ax, ay, az; int16 gx, gy, gz; } IMU_Data;

void Car_Forward(void){
    Dio_WriteChannel(MOTOR_PORT, ENA, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN1, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN2, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, ENB, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN3, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN4, STD_LOW);
}

void Car_Stop(void){
    Dio_WriteChannel(MOTOR_PORT, ENA, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN1, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN2, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, ENB, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN3, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN4, STD_LOW);
}

int main(void){
    RCC_EnableGPIO(LED_PORT);
    RCC_EnableGPIO(MOTOR_PORT);

    ApplyDir(LED_PORT, LED_PIN, DIR_OUTPUT);

    ApplyDir(MOTOR_PORT, ENA, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN1, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN2, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, ENB, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN3, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN4, DIR_OUTPUT);

    I2C_Init();
    MPU6050_Init();
    LCD_Init();

    LCD_Clear();
    LCD_SetCursor(0,0);
    LCD_SendString("BlackBox Ready");
    LCD_SetCursor(1,0);
    LCD_SendString("Demo Mode");

    Car_Forward();

    while(1){
        IMU_Data imu;
        MPU6050_Read(&imu.ax,&imu.ay,&imu.az,&imu.gx,&imu.gy,&imu.gz);
        int32 magnitude = imu.ax*imu.ax + imu.ay*imu.ay + imu.az*imu.az;

        LCD_SetCursor(0,0);
        if(magnitude > CRASH_THRESHOLD){
            LCD_SendString("CRASH: YES ");
            Car_Stop();
        } else {
            LCD_SendString("CRASH: NO  ");
            Car_Forward();
        }

        LCD_SetCursor(1,0);
        LCD_SendString("Acc: ");
        LCD_SendNumber(magnitude);

        Timer_DelayMs(100);
    }
}

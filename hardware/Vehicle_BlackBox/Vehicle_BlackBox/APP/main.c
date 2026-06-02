#include <stdio.h>
#include "../Inc/Common/Std_Types.h"
#include "../Inc/MCAL/DIO/DIO.h"
#include "../Inc/MCAL/RCC/RCC.h"
#include "../Inc/MCAL/Timer/Timer.h"
#include "../Inc/MCAL/I2C/I2C.h"
#include "../Inc/MCAL/UART/UART.h"
#include "../Drivers/LCD/LCD.h"
#include "../Drivers/MPU6050/MPU6050.h"

#define LED_PIN PIN_13
#define LED_PORT PORT_C

/*  Crash threshold in centi-g (100 = 1.0 g).
 *  150 = 1.5 g → matches the previous firmware and the app's default sensitivity. */
#define CRASH_THRESHOLD_CG 150

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

/* Integer square root (Newton's method) — used to compute g magnitude
 * without pulling in math.h or float printf. */
static uint32 isqrt32(uint32 n){
    if (n == 0) return 0;
    uint32 x = n;
    uint32 y = (x + 1U) >> 1;
    while (y < x){
        x = y;
        y = (x + n / x) >> 1;
    }
    return x;
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
    UART_Init();

    LCD_Clear();
    LCD_SetCursor(0,0);
    LCD_SendString("BlackBox Ready");
    LCD_SetCursor(1,0);
    LCD_SendString("Demo Mode");

    UART_SendString("BLACKBOX READY\r\n");

    Car_Forward();

    char buf[96];
    uint8 crashLatched = 0;   /* once a crash is detected, stay UNSAFE/STOP until reset */

    while(1){
        IMU_Data imu;
        MPU6050_Read(&imu.ax,&imu.ay,&imu.az,&imu.gx,&imu.gy,&imu.gz);

        /* Cast to int32 BEFORE the multiplication — previous code overflowed int16. */
        int32 ax32 = (int32)imu.ax;
        int32 ay32 = (int32)imu.ay;
        int32 az32 = (int32)imu.az;
        uint32 magsq = (uint32)(ax32*ax32) + (uint32)(ay32*ay32) + (uint32)(az32*az32);

        /* magnitude in raw LSBs, then convert to centi-g (1 g = 16384 LSB at ±2 g range). */
        uint32 mag = isqrt32(magsq);
        int g_cg = (int)((mag * 100U) / 16384U);   /* e.g. 100 = 1.00 g */

        if (g_cg > CRASH_THRESHOLD_CG) crashLatched = 1;
        uint8 isCrash = crashLatched;

        LCD_SetCursor(0,0);
        if(isCrash){
            LCD_SendString("CRASH: YES ");
            Car_Stop();
        } else {
            LCD_SendString("CRASH: NO  ");
            Car_Forward();
        }

        LCD_SetCursor(1,0);
        LCD_SendString("G:");
        LCD_SendNumber((uint32)g_cg);
        LCD_SendString(" cg      ");

        /* CSV line for the mobile app over HM-10 BLE.
         * Everything in centi-g (e.g. 100 = 1.00 g) — the parser then divides
         * by 100 uniformly. Example:
         *   AX:5,AY:-1,AZ:100,G:104,STATUS:SAFE\r\n
         * Conversion: raw_LSB * 100 / 16384  (at ±2 g full-scale range). */
        int ax_cg = (int)(((int32)imu.ax * 100) / 16384);
        int ay_cg = (int)(((int32)imu.ay * 100) / 16384);
        int az_cg = (int)(((int32)imu.az * 100) / 16384);

        snprintf(buf, sizeof(buf),
                 "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:%s\r\n",
                 ax_cg, ay_cg, az_cg, g_cg,
                 isCrash ? "CRASH" : "SAFE");
        UART_SendString(buf);

        Timer_DelayMs(100);
    }
}

/*
 *  GuardianDash — Vehicle_BlackBox firmware (final)
 *  ------------------------------------------------
 *  Uses ONLY the functions actually exposed in this project's headers:
 *    LCD.h  : LCD_Init, LCD_Clear, LCD_SetCursor, LCD_SendString
 *    Timer.h: (no delay — we use an inline busy-loop)
 */

#include <stdio.h>
#include <string.h>
#include "../Inc/Common/Std_Types.h"
#include "../Inc/MCAL/DIO/DIO.h"
#include "../Inc/MCAL/RCC/RCC.h"
#include "../Inc/MCAL/Timer/Timer.h"
#include "../Inc/MCAL/I2C/I2C.h"
#include "../Inc/MCAL/UART/UART.h"
#include "../Drivers/LCD/LCD.h"
#include "../Drivers/MPU6050/MPU6050.h"

#define CRASH_THRESHOLD_CG 150       /* 1.50 g */

#define ENA PIN_12
#define IN1 PIN_13
#define IN2 PIN_14
#define ENB PIN_15
#define IN3 PIN_8
#define IN4 PIN_9
#define MOTOR_PORT PORT_B

typedef struct { int16 ax, ay, az; int16 gx, gy, gz; } IMU_Data;

/* Busy-loop delay since Timer_DelayMs isn't in this Timer.h. */
static void delay_ms(uint32 ms){
    volatile uint32 i;
    while (ms--) {
        for (i = 0; i < 4000; i++) { __asm__("nop"); }
    }
}

static void Car_Forward(void){
    Dio_WriteChannel(MOTOR_PORT, ENA, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN1, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN2, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, ENB, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN3, STD_HIGH);
    Dio_WriteChannel(MOTOR_PORT, IN4, STD_LOW);
}

static void Car_Stop(void){
    Dio_WriteChannel(MOTOR_PORT, ENA, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN1, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN2, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, ENB, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN3, STD_LOW);
    Dio_WriteChannel(MOTOR_PORT, IN4, STD_LOW);
}

/* Integer sqrt for magnitude. */
static uint32 isqrt32(uint32 n){
    if (n == 0) return 0;
    uint32 x = n;
    uint32 y = (x + 1U) >> 1;
    while (y < x){ x = y; y = (x + n / x) >> 1; }
    return x;
}

/* Build "1.04" / "-0.05" style strings from a centi-g integer. */
static void fmt_signed(char *out, int v){
    int w = v / 100;
    int f = v % 100; if (f < 0) f = -f;
    if (v < 0 && w == 0) snprintf(out, 10, "-0.%02d", f);
    else                 snprintf(out, 10, "%d.%02d", w, f);
}

int main(void){
    /* Motor port */
    RCC_EnableGPIO(MOTOR_PORT);
    ApplyDir(MOTOR_PORT, ENA, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN1, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN2, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, ENB, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN3, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN4, DIR_OUTPUT);

    /* UART first so the boot trace is visible. */
    UART_Init();
    UART_SendString("\r\nBLACKBOX BOOT\r\n");

    I2C_Init();
    UART_SendString("I2C OK\r\n");

    MPU6050_Init();
    UART_SendString("MPU OK\r\n");

    LCD_Init();
    UART_SendString("LCD OK\r\n");

    LCD_Clear();
    LCD_SetCursor(0,0);
    LCD_SendString("BlackBox Ready ");
    LCD_SetCursor(1,0);
    LCD_SendString("Monitoring     ");

    UART_SendString("READY\r\n");

    Car_Forward();

    char buf[160];
    char lcd_line[20];
    char gs[10], xs[10], ys[10], zs[10];
    uint8 crashLatched = 0;

    while(1){
        IMU_Data imu;
        MPU6050_Read(&imu.ax, &imu.ay, &imu.az, &imu.gx, &imu.gy, &imu.gz);

        /* int32 cast BEFORE multiply — fixes the int16 overflow. */
        int32 ax32 = (int32)imu.ax;
        int32 ay32 = (int32)imu.ay;
        int32 az32 = (int32)imu.az;
        uint32 magsq = (uint32)(ax32*ax32) + (uint32)(ay32*ay32) + (uint32)(az32*az32);
        uint32 mag   = isqrt32(magsq);

        int g_cg  = (int)((mag * 100U) / 16384U);
        int ax_cg = (int)((ax32 * 100) / 16384);
        int ay_cg = (int)((ay32 * 100) / 16384);
        int az_cg = (int)((az32 * 100) / 16384);

        if (g_cg > CRASH_THRESHOLD_CG) crashLatched = 1;
        uint8 isCrash = crashLatched;

        /* LCD line 1: status */
        LCD_SetCursor(0,0);
        if (isCrash){
            LCD_SendString("CRASH: YES     ");
            Car_Stop();
        } else {
            LCD_SendString("CRASH: NO      ");
            Car_Forward();
        }

        /* LCD line 2: G value */
        LCD_SetCursor(1,0);
        snprintf(lcd_line, sizeof(lcd_line), "G:%d cg        ", g_cg);
        LCD_SendString(lcd_line);

        const char *status = isCrash ? "CRASH" : "SAFE";

        /* Format A: legacy floats — G:1.04,X:0.05,Y:-0.01,Z:1.00,STATUS:SAFE */
        fmt_signed(gs, g_cg);
        fmt_signed(xs, ax_cg);
        fmt_signed(ys, ay_cg);
        fmt_signed(zs, az_cg);
        snprintf(buf, sizeof(buf),
                 "G:%s,X:%s,Y:%s,Z:%s,STATUS:%s\r\n",
                 gs, xs, ys, zs, status);
        UART_SendString(buf);

        /* Format B: integer cents — AX:5,AY:-1,AZ:100,G:104,STATUS:SAFE */
        snprintf(buf, sizeof(buf),
                 "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:%s\r\n",
                 ax_cg, ay_cg, az_cg, g_cg, status);
        UART_SendString(buf);

        delay_ms(150);
    }
}

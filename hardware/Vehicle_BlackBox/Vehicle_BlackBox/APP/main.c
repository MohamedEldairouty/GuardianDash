/*
 *  GuardianDash — Vehicle_BlackBox firmware (with I2C diagnostic)
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

#define CRASH_THRESHOLD_CG 150

#define ENA PIN_12
#define IN1 PIN_13
#define IN2 PIN_14
#define ENB PIN_15
#define IN3 PIN_8
#define IN4 PIN_9
#define MOTOR_PORT PORT_B

typedef struct { int16 ax, ay, az; int16 gx, gy, gz; } IMU_Data;

static void delay_ms(uint32 ms){
    volatile uint32 i;
    while (ms--) for (i = 0; i < 4000; i++) __asm__("nop");
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

static uint32 isqrt32(uint32 n){
    if (n == 0) return 0;
    uint32 x = n;
    uint32 y = (x + 1U) >> 1;
    while (y < x){ x = y; y = (x + n / x) >> 1; }
    return x;
}

static void fmt_signed(char *out, int v){
    int w = v / 100;
    int f = v % 100; if (f < 0) f = -f;
    if (v < 0 && w == 0) snprintf(out, 10, "-0.%02d", f);
    else                 snprintf(out, 10, "%d.%02d", w, f);
}

int main(void){
    RCC_EnableGPIO(MOTOR_PORT);
    ApplyDir(MOTOR_PORT, ENA, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN1, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN2, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, ENB, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN3, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN4, DIR_OUTPUT);

    UART_Init();
    UART_SendString("\r\nBLACKBOX BOOT\r\n");

    I2C_Init();
    UART_SendString("I2C OK\r\n");

    /* ===== DIAGNOSTIC: read MPU WHO_AM_I (register 0x75) =====
     *   0x68 → MPU6050 responsive, I2C works
     *   0x00 → SDA stuck low or nothing responding
     *   0xFF → SDA pulled high but no ACK from device
     *   anything else → noise / wrong address
     */
    uint8 whoami = I2C_Read(0x68, 0x75);
    char dbg[40];
    snprintf(dbg, sizeof(dbg), "WHO_AM_I=0x%02X (expect 0x68)\r\n", whoami);
    UART_SendString(dbg);

    /* Also try alternate address 0x69 in case AD0 is high. */
    uint8 whoami_alt = I2C_Read(0x69, 0x75);
    snprintf(dbg, sizeof(dbg), "ALT WHO_AM_I=0x%02X\r\n", whoami_alt);
    UART_SendString(dbg);

    MPU6050_Init();
    uint8 used_addr = MPU6050_GetAddress();
    snprintf(dbg, sizeof(dbg), "MPU init done, using addr 0x%02X\r\n", used_addr);
    UART_SendString(dbg);

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

        LCD_SetCursor(0,0);
        if (isCrash){
            LCD_SendString("CRASH: YES     ");
            Car_Stop();
        } else {
            LCD_SendString("CRASH: NO      ");
            Car_Forward();
        }

        LCD_SetCursor(1,0);
        snprintf(lcd_line, sizeof(lcd_line), "G:%d cg        ", g_cg);
        LCD_SendString(lcd_line);

        const char *status = isCrash ? "CRASH" : "SAFE";

        fmt_signed(gs, g_cg);
        fmt_signed(xs, ax_cg);
        fmt_signed(ys, ay_cg);
        fmt_signed(zs, az_cg);
        snprintf(buf, sizeof(buf),
                 "G:%s,X:%s,Y:%s,Z:%s,STATUS:%s\r\n",
                 gs, xs, ys, zs, status);
        UART_SendString(buf);

        snprintf(buf, sizeof(buf),
                 "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:%s\r\n",
                 ax_cg, ay_cg, az_cg, g_cg, status);
        UART_SendString(buf);

        delay_ms(150);
    }
}

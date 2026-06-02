#include <stdio.h>
#include "../Inc/Common/Std_Types.h"
#include "../Inc/MCAL/DIO/DIO.h"
#include "../Inc/MCAL/RCC/RCC.h"
#include "../Inc/MCAL/Timer/Timer.h"
#include "../Inc/MCAL/I2C/I2C.h"
#include "../Drivers/LCD/LCD.h"
#include "../Drivers/MPU6050/MPU6050.h"

/* ============================================================
 * INLINE UART (USART1 @ 9600 baud, PA9 = TX, PA10 = RX, AF7)
 * No external file — just main.c. Can't fail the build.
 * ============================================================ */
#define U1_RCC_AHB1ENR  (*(volatile uint32*)0x40023830UL)
#define U1_RCC_APB2ENR  (*(volatile uint32*)0x40023844UL)
#define U1_GPIOA_MODER  (*(volatile uint32*)0x40020000UL)
#define U1_GPIOA_AFRH   (*(volatile uint32*)0x40020024UL)
#define U1_USART1_SR    (*(volatile uint32*)0x40011000UL)
#define U1_USART1_DR    (*(volatile uint32*)0x40011004UL)
#define U1_USART1_BRR   (*(volatile uint32*)0x40011008UL)
#define U1_USART1_CR1   (*(volatile uint32*)0x4001100CUL)

static void U1_Init(void){
    U1_RCC_AHB1ENR |= (1U << 0);              /* GPIOA clock */
    U1_RCC_APB2ENR |= (1U << 4);              /* USART1 clock */
    U1_GPIOA_MODER &= ~((3U<<18) | (3U<<20)); /* clear PA9, PA10 */
    U1_GPIOA_MODER |=  ((2U<<18) | (2U<<20)); /* AF mode */
    U1_GPIOA_AFRH  &= ~((0xFU<<4) | (0xFU<<8));
    U1_GPIOA_AFRH  |=  ((7U<<4)   | (7U<<8));  /* AF7 for PA9, PA10 */
    U1_USART1_CR1 = 0;
    U1_USART1_BRR = 0x683;                    /* 9600 baud @ 16 MHz HSI */
    U1_USART1_CR1 |= (1U<<3);                 /* TE */
    U1_USART1_CR1 |= (1U<<13);                /* UE */
}

static void U1_SendChar(uint8 c){
    while (!(U1_USART1_SR & (1U<<7))) {}      /* wait TXE */
    U1_USART1_DR = (uint32)c;
}

static void U1_SendString(const char *s){
    while (*s) { U1_SendChar((uint8)*s); s++; }
    while (!(U1_USART1_SR & (1U<<6))) {}      /* wait TC */
}
/* ============================================================ */

#define LED_PIN PIN_13
#define LED_PORT PORT_C

#define CRASH_THRESHOLD_CG 150  /* 1.50 g */

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

/* Integer square root (Newton's method) — no math.h needed. */
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

    /* Bring UART up FIRST so we can debug even if MPU/LCD init hangs. */
    U1_Init();
    U1_SendString("BOOT\r\n");

    I2C_Init();
    U1_SendString("I2C_OK\r\n");

    MPU6050_Init();
    U1_SendString("MPU_OK\r\n");

    LCD_Init();
    U1_SendString("LCD_OK\r\n");

    LCD_Clear();
    LCD_SetCursor(0,0);
    LCD_SendString("BlackBox Ready");
    LCD_SetCursor(1,0);
    LCD_SendString("Demo Mode");

    U1_SendString("BLACKBOX READY\r\n");

    Car_Forward();

    char buf[96];
    uint8 crashLatched = 0;

    while(1){
        IMU_Data imu;
        MPU6050_Read(&imu.ax,&imu.ay,&imu.az,&imu.gx,&imu.gy,&imu.gz);

        /* int32 cast BEFORE multiplication — fixes overflow bug. */
        int32 ax32 = (int32)imu.ax;
        int32 ay32 = (int32)imu.ay;
        int32 az32 = (int32)imu.az;
        uint32 magsq = (uint32)(ax32*ax32) + (uint32)(ay32*ay32) + (uint32)(az32*az32);

        uint32 mag = isqrt32(magsq);
        int g_cg = (int)((mag * 100U) / 16384U);

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
        LCD_SendString(" cg     ");

        /* Send CSV to phone app. Everything in centi-g.
         * Example: AX:5,AY:-1,AZ:100,G:104,STATUS:SAFE */
        int ax_cg = (int)(((int32)imu.ax * 100) / 16384);
        int ay_cg = (int)(((int32)imu.ay * 100) / 16384);
        int az_cg = (int)(((int32)imu.az * 100) / 16384);

        snprintf(buf, sizeof(buf),
                 "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:%s\r\n",
                 ax_cg, ay_cg, az_cg, g_cg,
                 isCrash ? "CRASH" : "SAFE");
        U1_SendString(buf);

        Timer_DelayMs(100);
    }
}

<<<<<<< HEAD
#include "../Inc/MCAL/UART/UART.h"

int main(void){
    UART_Init();
    while(1){
        UART_SendString("HELLO HM-10\r\n");
        for(volatile int i=0; i<1000000;i++); // crude delay
=======
/*
 *  GuardianDash — Vehicle_BlackBox firmware
 *  ----------------------------------------
 *  STM32F401, MCAL structure. Inline UART (USART1) so the build never
 *  fails due to missing source paths.
 *
 *  Hardware:
 *      MPU6050  ── I2C1 (PB6 SCL, PB7 SDA), AD0 → GND  (addr 0x68)
 *      LCD 16x2 ── I2C1 backpack (addr 0x27)
 *      HM-10    ── USART1 (PA9 TX → HM-10 RX, PA10 RX ← HM-10 TX)
 *      L298     ── PORT_B  ENA=12 IN1=13 IN2=14 ENB=15 IN3=8 IN4=9
 *      Heartbeat LED on PC13
 *
 *  CSV line sent every 100 ms:
 *      AX:5,AY:-1,AZ:100,G:104,STATUS:SAFE\r\n
 *  (values in centi-g; STATUS becomes CRASH when G > 1.50 g)
 */

#include <stdio.h>
#include "../Inc/Common/Std_Types.h"
#include "../Inc/MCAL/DIO/DIO.h"
#include "../Inc/MCAL/RCC/RCC.h"
#include "../Inc/MCAL/Timer/Timer.h"
#include "../Inc/MCAL/I2C/I2C.h"
#include "../Drivers/LCD/LCD.h"
#include "../Drivers/MPU6050/MPU6050.h"

/* ============================================================
 * INLINE UART (USART1 @ 9600 baud, PA9 TX / PA10 RX, AF7)
 * ============================================================ */
#define U_RCC_AHB1ENR  (*(volatile uint32*)0x40023830UL)
#define U_RCC_APB2ENR  (*(volatile uint32*)0x40023844UL)
#define U_GPIOA_MODER  (*(volatile uint32*)0x40020000UL)
#define U_GPIOA_AFRH   (*(volatile uint32*)0x40020024UL)
#define U_GPIOC_MODER  (*(volatile uint32*)0x40020800UL)
#define U_GPIOC_ODR    (*(volatile uint32*)0x40020814UL)
#define U_USART1_SR    (*(volatile uint32*)0x40011000UL)
#define U_USART1_DR    (*(volatile uint32*)0x40011004UL)
#define U_USART1_BRR   (*(volatile uint32*)0x40011008UL)
#define U_USART1_CR1   (*(volatile uint32*)0x4001100CUL)

static void U_Init(void){
    U_RCC_AHB1ENR |= (1U << 0);                       /* GPIOA */
    U_RCC_AHB1ENR |= (1U << 2);                       /* GPIOC (LED) */
    U_RCC_APB2ENR |= (1U << 4);                       /* USART1 */

    U_GPIOC_MODER &= ~(3U << (13 * 2));
    U_GPIOC_MODER |=  (1U << (13 * 2));               /* PC13 output */

    U_GPIOA_MODER &= ~((3U << 18) | (3U << 20));
    U_GPIOA_MODER |=  ((2U << 18) | (2U << 20));      /* PA9/PA10 AF */
    U_GPIOA_AFRH  &= ~((0xFU << 4) | (0xFU << 8));
    U_GPIOA_AFRH  |=  ((7U   << 4) | (7U   << 8));    /* AF7 */

    U_USART1_CR1 = 0;
    U_USART1_BRR = 0x683;                             /* 9600 @ 16 MHz */
    U_USART1_CR1 |= (1U << 3);                        /* TE */
    U_USART1_CR1 |= (1U << 13);                       /* UE */
}

static void U_SendChar(uint8 c){
    while (!(U_USART1_SR & (1U << 7))) {}
    U_USART1_DR = (uint32)c;
}

static void U_SendString(const char *s){
    while (*s) U_SendChar((uint8)*s++);
    while (!(U_USART1_SR & (1U << 6))) {}             /* TC */
}

static void Heartbeat(void){ U_GPIOC_ODR ^= (1U << 13); }

/* Integer square root — for the magnitude calculation, no math.h. */
static uint32 isqrt32(uint32 n){
    if (n == 0) return 0;
    uint32 x = n;
    uint32 y = (x + 1U) >> 1;
    while (y < x){ x = y; y = (x + n / x) >> 1; }
    return x;
}

/* ============================================================
 * Application
 * ============================================================ */
#define CRASH_THRESHOLD_CG 150   /* 1.50 g */

#define ENA PIN_12
#define IN1 PIN_13
#define IN2 PIN_14
#define ENB PIN_15
#define IN3 PIN_8
#define IN4 PIN_9
#define MOTOR_PORT PORT_B

typedef struct { int16 ax, ay, az; int16 gx, gy, gz; } IMU_Data;

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

int main(void){
    /* --- Bring up motor + LED ports first --- */
    RCC_EnableGPIO(MOTOR_PORT);
    ApplyDir(MOTOR_PORT, ENA, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN1, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN2, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, ENB, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN3, DIR_OUTPUT);
    ApplyDir(MOTOR_PORT, IN4, DIR_OUTPUT);

    /* --- UART up FIRST — gives us a debug channel even if I2C hangs --- */
    U_Init();
    U_SendString("\r\nBLACKBOX BOOT\r\n");

    /* --- I2C + sensors --- */
    I2C_Init();
    U_SendString("I2C OK\r\n");

    MPU6050_Init();
    U_SendString("MPU OK\r\n");

    LCD_Init();
    U_SendString("LCD OK\r\n");

    LCD_Clear();
    LCD_SetCursor(0,0);
    LCD_SendString("BlackBox Ready ");
    LCD_SetCursor(1,0);
    LCD_SendString("Monitoring     ");

    U_SendString("READY\r\n");

    Car_Forward();

    char buf[96];
    uint8 crashLatched = 0;

    while(1){
        Heartbeat();

        IMU_Data imu;
        MPU6050_Read(&imu.ax, &imu.ay, &imu.az, &imu.gx, &imu.gy, &imu.gz);

        /* Magnitude — cast to int32 BEFORE multiply to avoid int16 overflow. */
        int32 ax32 = (int32)imu.ax;
        int32 ay32 = (int32)imu.ay;
        int32 az32 = (int32)imu.az;
        uint32 magsq = (uint32)(ax32*ax32) + (uint32)(ay32*ay32) + (uint32)(az32*az32);
        uint32 mag   = isqrt32(magsq);

        /* Convert to centi-g (1 g = 16384 raw LSB at ±2 g full-scale). */
        int g_cg  = (int)((mag * 100U) / 16384U);
        int ax_cg = (int)(((int32)imu.ax * 100) / 16384);
        int ay_cg = (int)(((int32)imu.ay * 100) / 16384);
        int az_cg = (int)(((int32)imu.az * 100) / 16384);

        if (g_cg > CRASH_THRESHOLD_CG) crashLatched = 1;
        uint8 isCrash = crashLatched;

        /* --- LCD --- */
        LCD_SetCursor(0,0);
        if (isCrash){
            LCD_SendString("CRASH: YES     ");
            Car_Stop();
        } else {
            LCD_SendString("CRASH: NO      ");
            Car_Forward();
        }
        LCD_SetCursor(1,0);
        LCD_SendString("G:");
        LCD_SendNumber((uint32)g_cg);
        LCD_SendString(" cg      ");

        /* --- BLE / app feed --- */
        snprintf(buf, sizeof(buf),
                 "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:%s\r\n",
                 ax_cg, ay_cg, az_cg, g_cg,
                 isCrash ? "CRASH" : "SAFE");
        U_SendString(buf);

        Timer_DelayMs(100);
>>>>>>> fea556802522e8c74b510d4f70f264c706952ce0
    }
}

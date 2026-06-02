#include "I2C.h"
#include "../RCC/RCC.h"
#include "../DIO/DIO.h"

/* =================================================================
 *  Bare-metal I2C1 driver (STM32F401)
 *  Pins: PB6 = SCL, PB7 = SDA  (alternate function AF4)
 *  Speed: 100 kHz (standard mode)
 *  Note: PB6/PB7 must be Open-Drain with pull-ups (external 4.7k or
 *        internal). The MPU6050 / LCD modules usually have pull-ups
 *        on their breakouts.
 * ================================================================= */

#define I2C1_BASE   0x40005400UL
#define RCC_BASE    0x40023800UL
#define GPIOB_BASE  0x40020400UL

#define RCC_AHB1ENR (*(volatile uint32*)(RCC_BASE + 0x30))
#define RCC_APB1ENR (*(volatile uint32*)(RCC_BASE + 0x40))

#define GPIOB_MODER  (*(volatile uint32*)(GPIOB_BASE + 0x00))
#define GPIOB_OTYPER (*(volatile uint32*)(GPIOB_BASE + 0x04))
#define GPIOB_OSPEED (*(volatile uint32*)(GPIOB_BASE + 0x08))
#define GPIOB_PUPDR  (*(volatile uint32*)(GPIOB_BASE + 0x0C))
#define GPIOB_AFRL   (*(volatile uint32*)(GPIOB_BASE + 0x20))

#define I2C_CR1   (*(volatile uint32*)(I2C1_BASE + 0x00))
#define I2C_CR2   (*(volatile uint32*)(I2C1_BASE + 0x04))
#define I2C_CCR   (*(volatile uint32*)(I2C1_BASE + 0x1C))
#define I2C_TRISE (*(volatile uint32*)(I2C1_BASE + 0x20))
#define I2C_DR    (*(volatile uint32*)(I2C1_BASE + 0x10))
#define I2C_SR1   (*(volatile uint32*)(I2C1_BASE + 0x14))
#define I2C_SR2   (*(volatile uint32*)(I2C1_BASE + 0x18))

/* SR1 flags */
#define SR1_SB    (1U << 0)
#define SR1_ADDR  (1U << 1)
#define SR1_BTF   (1U << 2)
#define SR1_RXNE  (1U << 6)
#define SR1_TXE   (1U << 7)

/* SR2 flags */
#define SR2_BUSY  (1U << 1)

/* CR1 control */
#define CR1_PE    (1U << 0)
#define CR1_START (1U << 8)
#define CR1_STOP  (1U << 9)
#define CR1_ACK   (1U << 10)
#define CR1_SWRST (1U << 15)

void I2C_Init(void)
{
    /* --- 1. Enable clocks --- */
    RCC_AHB1ENR |= (1U << 1);              /* GPIOB */
    RCC_APB1ENR |= (1U << 21);             /* I2C1 */

    /* --- 2. PB6, PB7 as AF mode, open-drain, pull-up, AF4 (I2C1) --- */
    GPIOB_MODER  &= ~((3U << (6 * 2)) | (3U << (7 * 2)));
    GPIOB_MODER  |=  ((2U << (6 * 2)) | (2U << (7 * 2)));    /* AF mode */
    GPIOB_OTYPER |=  ((1U << 6) | (1U << 7));                /* open-drain */
    GPIOB_OSPEED |=  ((3U << (6 * 2)) | (3U << (7 * 2)));    /* high speed */
    GPIOB_PUPDR  &= ~((3U << (6 * 2)) | (3U << (7 * 2)));
    GPIOB_PUPDR  |=  ((1U << (6 * 2)) | (1U << (7 * 2)));    /* internal pull-up */
    GPIOB_AFRL   &= ~((0xFU << (6 * 4)) | (0xFU << (7 * 4)));
    GPIOB_AFRL   |=  ((4U   << (6 * 4)) | (4U   << (7 * 4)));/* AF4 */

    /* --- 3. I2C peripheral config: 100 kHz @ APB1=16 MHz --- */
    I2C_CR1 = CR1_SWRST;
    I2C_CR1 = 0;

    I2C_CR2   = 16;                        /* APB1 = 16 MHz */
    I2C_CCR   = 80;                        /* 100 kHz standard mode */
    I2C_TRISE = 17;

    I2C_CR1 = CR1_PE | CR1_ACK;
}

void I2C_Start(void)
{
    I2C_CR1 |= CR1_START;
    while (!(I2C_SR1 & SR1_SB)) {}
}

void I2C_Stop(void)
{
    I2C_CR1 |= CR1_STOP;
}

uint8 I2C_Write(uint8 dev_addr, uint8 reg_addr, uint8 data)
{
    /* Wait until bus is free. */
    while (I2C_SR2 & SR2_BUSY) {}

    I2C_CR1 |= CR1_ACK;
    I2C_CR1 |= CR1_START;
    while (!(I2C_SR1 & SR1_SB)) {}

    I2C_DR = (dev_addr << 1);                  /* write */
    while (!(I2C_SR1 & SR1_ADDR)) {}
    (void)I2C_SR2;

    while (!(I2C_SR1 & SR1_TXE)) {}
    I2C_DR = reg_addr;

    while (!(I2C_SR1 & SR1_TXE)) {}
    I2C_DR = data;

    while (!(I2C_SR1 & SR1_BTF)) {}
    I2C_CR1 |= CR1_STOP;

    return 0;
}

uint8 I2C_Read(uint8 dev_addr, uint8 reg_addr)
{
    uint8 data;

    while (I2C_SR2 & SR2_BUSY) {}

    /* Phase 1 — write register address with NO stop */
    I2C_CR1 |= CR1_ACK;
    I2C_CR1 |= CR1_START;
    while (!(I2C_SR1 & SR1_SB)) {}

    I2C_DR = (dev_addr << 1);                  /* write */
    while (!(I2C_SR1 & SR1_ADDR)) {}
    (void)I2C_SR2;

    while (!(I2C_SR1 & SR1_TXE)) {}
    I2C_DR = reg_addr;
    while (!(I2C_SR1 & SR1_BTF)) {}

    /* Phase 2 — repeated start, read 1 byte with NACK + STOP */
    I2C_CR1 |= CR1_START;
    while (!(I2C_SR1 & SR1_SB)) {}

    I2C_DR = (dev_addr << 1) | 1;              /* read */
    while (!(I2C_SR1 & SR1_ADDR)) {}

    I2C_CR1 &= ~CR1_ACK;                       /* NACK the byte */
    (void)I2C_SR2;                             /* clear ADDR */
    I2C_CR1 |= CR1_STOP;                       /* program STOP */

    while (!(I2C_SR1 & SR1_RXNE)) {}
    data = I2C_DR;

    I2C_CR1 |= CR1_ACK;                        /* re-arm for next time */
    return data;
}

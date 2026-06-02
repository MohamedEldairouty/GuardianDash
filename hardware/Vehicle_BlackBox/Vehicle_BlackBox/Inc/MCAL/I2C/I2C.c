#include "I2C.h"
#include "../RCC/RCC.h"
#include "../DIO/DIO.h"

/* =================================================================
 *  Bare-metal I2C1 driver (STM32F401)  —  with timeouts so a dead
 *  MPU / LCD can't hang the whole firmware.
 *  Pins: PB6 = SCL, PB7 = SDA  (AF4)   Speed: 100 kHz
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

#define SR1_SB    (1U << 0)
#define SR1_ADDR  (1U << 1)
#define SR1_BTF   (1U << 2)
#define SR1_AF    (1U << 10)   /* ACK failure */
#define SR1_RXNE  (1U << 6)
#define SR1_TXE   (1U << 7)

#define SR2_BUSY  (1U << 1)

#define CR1_PE    (1U << 0)
#define CR1_START (1U << 8)
#define CR1_STOP  (1U << 9)
#define CR1_ACK   (1U << 10)
#define CR1_SWRST (1U << 15)

/* Spin until `cond` true or `tmo` cycles elapse. Returns 1 on success,
 * 0 on timeout. ~16 MHz CPU → tmo of 200000 ≈ 12 ms. */
static uint8 wait_for(volatile uint32 *reg, uint32 mask, uint32 tmo, uint8 set){
    while (tmo--) {
        if (set  &&  (*reg & mask)) return 1;
        if (!set && !(*reg & mask)) return 1;
    }
    return 0;
}

#define WAIT_SET(R, M)   if (!wait_for(&(R), (M), 200000, 1)) goto bail
#define WAIT_CLR(R, M)   if (!wait_for(&(R), (M), 200000, 0)) goto bail

void I2C_Init(void)
{
    /* 1. Clocks */
    RCC_AHB1ENR |= (1U << 1);              /* GPIOB */
    RCC_APB1ENR |= (1U << 21);             /* I2C1 */

    /* 2. PB6 = SCL, PB7 = SDA  — AF mode, open-drain, internal pull-up, AF4 */
    GPIOB_MODER  &= ~((3U << (6*2)) | (3U << (7*2)));
    GPIOB_MODER  |=  ((2U << (6*2)) | (2U << (7*2)));
    GPIOB_OTYPER |=  ((1U << 6) | (1U << 7));
    GPIOB_OSPEED |=  ((3U << (6*2)) | (3U << (7*2)));
    GPIOB_PUPDR  &= ~((3U << (6*2)) | (3U << (7*2)));
    GPIOB_PUPDR  |=  ((1U << (6*2)) | (1U << (7*2)));
    GPIOB_AFRL   &= ~((0xFU << (6*4)) | (0xFU << (7*4)));
    GPIOB_AFRL   |=  ((4U   << (6*4)) | (4U   << (7*4)));

    /* 3. Peripheral */
    I2C_CR1 = CR1_SWRST; I2C_CR1 = 0;
    I2C_CR2   = 16;
    I2C_CCR   = 80;
    I2C_TRISE = 17;
    I2C_CR1 = CR1_PE | CR1_ACK;
}

void I2C_Start(void)
{
    I2C_CR1 |= CR1_START;
    wait_for(&I2C_SR1, SR1_SB, 200000, 1);
}

void I2C_Stop(void) { I2C_CR1 |= CR1_STOP; }

uint8 I2C_Write(uint8 dev_addr, uint8 reg_addr, uint8 data)
{
    WAIT_CLR(I2C_SR2, SR2_BUSY);

    I2C_CR1 |= CR1_ACK;
    I2C_CR1 |= CR1_START;
    WAIT_SET(I2C_SR1, SR1_SB);

    I2C_DR = (dev_addr << 1);
    WAIT_SET(I2C_SR1, SR1_ADDR);
    (void)I2C_SR2;

    WAIT_SET(I2C_SR1, SR1_TXE);
    I2C_DR = reg_addr;

    WAIT_SET(I2C_SR1, SR1_TXE);
    I2C_DR = data;

    WAIT_SET(I2C_SR1, SR1_BTF);
    I2C_CR1 |= CR1_STOP;
    return 0;

bail:
    /* Clear any pending error bits + force STOP so the bus is released. */
    I2C_SR1 &= ~SR1_AF;
    I2C_CR1 |= CR1_STOP;
    return 1;
}

uint8 I2C_Read(uint8 dev_addr, uint8 reg_addr)
{
    uint8 data;

    WAIT_CLR(I2C_SR2, SR2_BUSY);

    I2C_CR1 |= CR1_ACK;
    I2C_CR1 |= CR1_START;
    WAIT_SET(I2C_SR1, SR1_SB);

    I2C_DR = (dev_addr << 1);
    WAIT_SET(I2C_SR1, SR1_ADDR);
    (void)I2C_SR2;

    WAIT_SET(I2C_SR1, SR1_TXE);
    I2C_DR = reg_addr;
    WAIT_SET(I2C_SR1, SR1_BTF);

    I2C_CR1 |= CR1_START;
    WAIT_SET(I2C_SR1, SR1_SB);

    I2C_DR = (dev_addr << 1) | 1;
    WAIT_SET(I2C_SR1, SR1_ADDR);

    I2C_CR1 &= ~CR1_ACK;
    (void)I2C_SR2;
    I2C_CR1 |= CR1_STOP;

    WAIT_SET(I2C_SR1, SR1_RXNE);
    data = I2C_DR;

    I2C_CR1 |= CR1_ACK;
    return data;

bail:
    /* Recover the bus on any failure — return a sentinel so caller knows. */
    I2C_SR1 &= ~SR1_AF;
    I2C_CR1 |= CR1_STOP;
    I2C_CR1 |= CR1_ACK;
    return 0xFF;
}

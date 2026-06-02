#include "I2C.h"
#include "../RCC/RCC.h"
#include "../DIO/DIO.h"

#define I2C1_BASE 0x40005400UL
#define RCC_BASE   0x40023800UL

#define RCC_APB1ENR (*(volatile uint32*)(RCC_BASE + 0x40))

#define I2C_CR1   (*(volatile uint32*)(I2C1_BASE + 0x00))
#define I2C_CR2   (*(volatile uint32*)(I2C1_BASE + 0x04))
#define I2C_CCR   (*(volatile uint32*)(I2C1_BASE + 0x1C))
#define I2C_TRISE (*(volatile uint32*)(I2C1_BASE + 0x20))
#define I2C_DR    (*(volatile uint32*)(I2C1_BASE + 0x10))
#define I2C_SR1   (*(volatile uint32*)(I2C1_BASE + 0x14))
#define I2C_SR2   (*(volatile uint32*)(I2C1_BASE + 0x18))

void I2C_Init(void)
{
    RCC_EnableGPIO(PORT_B);
    RCC_APB1ENR |= (1 << 21); // Enable I2C1 clock
    I2C_CR1 = 0x8000;          // Reset I2C
    I2C_CR2 = 16;              // APB1 freq
    I2C_CCR = 80;              // 100kHz
    I2C_TRISE = 17;
    I2C_CR1 = 0x01;            // Enable I2C
}

void I2C_Start(void)
{
    I2C_CR1 |= 0x0100;           // Generate START
    while (!(I2C_SR1 & 0x0001)); // Wait for SB
}

void I2C_Stop(void)
{
    I2C_CR1 |= 0x0200;           // Generate STOP
}

uint8 I2C_Write(uint8 dev_addr, uint8 reg_addr, uint8 data)
{
    I2C_Start();
    I2C_DR = (dev_addr << 1);        // Send address + write
    while (!(I2C_SR1 & 0x0002));
    (void)I2C_SR2;

    I2C_DR = reg_addr;               // Send register
    while (!(I2C_SR1 & 0x0080));

    I2C_DR = data;                   // Send data
    while (!(I2C_SR1 & 0x0080));

    I2C_Stop();
    return 0;
}

uint8 I2C_Read(uint8 dev_addr, uint8 reg_addr)
{
    uint8 data;
    // Write register address first
    I2C_Start();
    I2C_DR = (dev_addr << 1);        // write
    while (!(I2C_SR1 & 0x0002));
    (void)I2C_SR2;

    I2C_DR = reg_addr;
    while (!(I2C_SR1 & 0x0080));

    // Repeated start to read
    I2C_Start();
    I2C_DR = (dev_addr << 1) | 1;    // read
    while (!(I2C_SR1 & 0x0002));
    (void)I2C_SR2;

    data = I2C_DR;
    I2C_Stop();
    return data;
}

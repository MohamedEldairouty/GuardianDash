#include "ADC.h"

#define ADC1_BASE 0x40012000UL
#define ADC_SR_OFFSET 0x00
#define ADC_CR1_OFFSET 0x04
#define ADC_CR2_OFFSET 0x08
#define ADC_SMPR2_OFFSET 0x10
#define ADC_SQR1_OFFSET 0x2C
#define ADC_SQR3_OFFSET 0x34
#define ADC_DR_OFFSET 0x4C
#define ADC_CCR_OFFSET 0x04

#define ADC_SR   (*(volatile uint32*)(ADC1_BASE + ADC_SR_OFFSET))
#define ADC_CR1  (*(volatile uint32*)(ADC1_BASE + ADC_CR1_OFFSET))
#define ADC_CR2  (*(volatile uint32*)(ADC1_BASE + ADC_CR2_OFFSET))
#define ADC_SMPR2 (*(volatile uint32*)(ADC1_BASE + ADC_SMPR2_OFFSET))
#define ADC_SQR1  (*(volatile uint32*)(ADC1_BASE + ADC_SQR1_OFFSET))
#define ADC_SQR3  (*(volatile uint32*)(ADC1_BASE + ADC_SQR3_OFFSET))
#define ADC_DR    (*(volatile uint32*)(ADC1_BASE + ADC_DR_OFFSET))
#define ADC_CCR   (*(volatile uint32*)(ADC1_BASE + 0x300UL + ADC_CCR_OFFSET))

void ADC_Init(){
    ADC_CR1 &= ~(3 << 24);
    ADC_CR2 |= 1;
    ADC_CR2 &= ~(1 << 11);
    ADC_CCR |= (3 << 16);
    ADC_SMPR2 |= (7 << 0);
    ADC_SQR1 &= ~(15 << 20);
}

void ADC_SelectChannel(ADC_Channel channel){ ADC_SQR3 = channel; }
void ADC_Start(){ ADC_CR2 |= (1 << 30); }

uint16 ADC_Read(){
    while((ADC_SR & (1 << 1)) == 0);
    return ADC_DR;
}

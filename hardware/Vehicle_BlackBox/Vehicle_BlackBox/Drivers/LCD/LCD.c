#include "LCD.h"
#include <string.h>
#include <stdio.h>

#define ENABLE_DELAY 400   // Adjusted for reliable LCD init

static void notExactTimeDelay(uint32 count){
    volatile uint32 i;
    for(i=0;i<count;i++);
}

static void LCD_Write4Bits(uint8 data){
    I2C_Write(LCD_ADDR, 0x00, data | 0x08); // Backlight ON
    notExactTimeDelay(ENABLE_DELAY);
}

static void LCD_Enable(void){
    I2C_Write(LCD_ADDR, 0x00, 0x04 | 0x08); // E high
    notExactTimeDelay(ENABLE_DELAY);
    I2C_Write(LCD_ADDR, 0x00, 0x00 | 0x08); // E low
    notExactTimeDelay(ENABLE_DELAY);
}

static void LCD_SendByte(uint8 data, uint8 mode){
    uint8 high = data & 0xF0;
    uint8 low  = (data << 4) & 0xF0;
    if(mode) high |= 0x01;
    if(mode) low  |= 0x01;

    LCD_Write4Bits(high);
    LCD_Enable();
    LCD_Write4Bits(low);
    LCD_Enable();
}

void LCD_Init(void){
    Timer_DelayMs(50);
    LCD_Write4Bits(0x30); notExactTimeDelay(ENABLE_DELAY);
    LCD_Write4Bits(0x30); notExactTimeDelay(ENABLE_DELAY);
    LCD_Write4Bits(0x30); notExactTimeDelay(ENABLE_DELAY);
    LCD_Write4Bits(0x20); notExactTimeDelay(ENABLE_DELAY); // 4-bit mode

    LCD_SendByte(0x28,0); // 2 lines, 5x8
    LCD_SendByte(0x0C,0); // display ON, cursor OFF
    LCD_SendByte(0x06,0); // entry mode
    LCD_Clear();
    LCD_Backlight(1);
}

void LCD_Clear(void){
    LCD_SendByte(0x01,0);
    Timer_DelayMs(2);
}

void LCD_SetCursor(uint8 row, uint8 col){
    uint8 addr = (row==0)?0x80:0xC0;
    addr += col;
    LCD_SendByte(addr,0);
}

void LCD_SendChar(char c){ LCD_SendByte(c,1); }

void LCD_SendString(char* str){
    while(*str) LCD_SendChar(*str++);
}

void LCD_SendNumber(uint32_t num){
    char buf[12];
    snprintf(buf,sizeof(buf),"%lu",num);
    LCD_SendString(buf);
}

void LCD_Backlight(uint8 state){
    LCD_Write4Bits(state?0x08:0x00);
    LCD_Enable();
}

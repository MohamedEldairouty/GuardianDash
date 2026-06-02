#include "LCD.h"
#include <string.h>

static void LCD_SendNibble(uint8 nibble, uint8 rs){
    uint8 data = (nibble & 0xF0);
    if(rs) data |= 0x01; // RS=1 for data
    else data &= ~0x01;  // RS=0 for command
    I2C_Write(LCD_ADDR, 0, data | 0x04); // Enable high
    I2C_Write(LCD_ADDR, 0, data & ~0x04); // Enable low
}

void LCD_SendCommand(uint8 cmd){
    LCD_SendNibble(cmd & 0xF0, 0);
    LCD_SendNibble((cmd<<4) & 0xF0, 0);
}

void LCD_SendData(uint8 data){
    LCD_SendNibble(data & 0xF0, 1);
    LCD_SendNibble((data<<4) & 0xF0, 1);
}

void LCD_Init(void){
    for(uint32 i=0; i<50000; i++); // simple delay
    LCD_SendCommand(0x33);
    LCD_SendCommand(0x32);
    LCD_SendCommand(0x28); // 4-bit, 2 lines
    LCD_SendCommand(0x0C); // Display on, cursor off
    LCD_SendCommand(0x06); // Entry mode
    LCD_Clear();
}

void LCD_Clear(void){
    LCD_SendCommand(0x01);
}

void LCD_SetCursor(uint8 row, uint8 col){
    uint8 addr = (row==0)?0x80:0xC0;
    addr += col;
    LCD_SendCommand(addr);
}

void LCD_SendString(char* str){
    for(uint8 i=0;i<strlen(str);i++){
        LCD_SendData(str[i]);
    }
}

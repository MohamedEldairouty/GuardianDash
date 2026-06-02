#ifndef LCD_H_
#define LCD_H_

#include "../../Inc/MCAL/I2C/I2C.h"
#include "../../Inc/Common/Std_Types.h"  // corrected path

#define LCD_ADDR 0x27  // Adjust to your LCD I2C address

void LCD_Init(void);
void LCD_SendCommand(uint8 cmd);
void LCD_SendData(uint8 data);
void LCD_SendString(char* str);
void LCD_Clear(void);
void LCD_SetCursor(uint8 row, uint8 col);

#endif

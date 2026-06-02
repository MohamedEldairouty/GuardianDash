#ifndef LCD_H_
#define LCD_H_

#include <stdint.h>
#include "../../Inc/Common/Std_Types.h"
#include "../../Inc/MCAL/I2C/I2C.h"
#include "../../Inc/MCAL/Timer/Timer.h"

#define LCD_ADDR 0x27     // Change to 0x3F if needed
#define LCD_COLS 16
#define LCD_ROWS 2

void LCD_Init(void);
void LCD_Clear(void);
void LCD_SetCursor(uint8 row, uint8 col);
void LCD_SendChar(char c);
void LCD_SendString(char* str);
void LCD_SendNumber(uint32_t num);
void LCD_Backlight(uint8 state);

#endif

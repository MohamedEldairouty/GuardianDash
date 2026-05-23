/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  */
/* USER CODE END Header */

#include "main.h"
#include "i2c.h"
#include "spi.h"
#include "usart.h"
#include "gpio.h"

#include "i2c-lcd.h"
#include "mpu6050.h"

#include <stdio.h>
#include <string.h>

void SystemClock_Config(void);

int main(void)
{
  HAL_Init();
  SystemClock_Config();

  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  MX_USART1_UART_Init();

  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_SET); // CAN CS high

  HAL_Delay(1000);

  lcd_init();
  HAL_Delay(200);
  lcd_clear();

  MPU6050_t MPU6050;

  uint8_t accidentDetected = 0;

  char line1[32];
  char line2[32];
  char bleMsg[128];

  lcd_put_cur(0, 0);
  lcd_send_string("BLACKBOX READY ");
  lcd_put_cur(1, 0);
  lcd_send_string("BLE STARTING   ");

  HAL_UART_Transmit(&huart1,
                    (uint8_t *)"BLACKBOX READY\r\n",
                    strlen("BLACKBOX READY\r\n"),
                    100);

  HAL_Delay(1500);
  lcd_clear();

  if (MPU6050_Init(&hi2c1) == 0)
  {
    lcd_put_cur(0, 0);
    lcd_send_string("MPU READY      ");
    lcd_put_cur(1, 0);
    lcd_send_string("MONITORING     ");
  }
  else
  {
    lcd_put_cur(0, 0);
    lcd_send_string("MPU ERROR      ");
    lcd_put_cur(1, 0);
    lcd_send_string("CHECK WIRING   ");

    HAL_UART_Transmit(&huart1,
                      (uint8_t *)"MPU ERROR\r\n",
                      strlen("MPU ERROR\r\n"),
                      100);

    while (1) {}
  }

  HAL_Delay(1500);
  lcd_clear();

  while (1)
  {
    MPU6050_Read_Accel(&hi2c1, &MPU6050);

    int ax = (int)(MPU6050.Ax * 100);
    int ay = (int)(MPU6050.Ay * 100);
    int az = (int)(MPU6050.Az * 100);
    int g  = (int)(MPU6050.Gforce * 100);

    if (MPU6050.Gforce > 1.50f)
    {
      accidentDetected = 1;
    }

    if (HAL_GPIO_ReadPin(GPIOC, GPIO_PIN_13) == GPIO_PIN_RESET)
    {
      accidentDetected = 0;

      lcd_put_cur(0, 0);
      lcd_send_string("RESET DONE     ");
      lcd_put_cur(1, 0);
      lcd_send_string("MONITORING     ");

      HAL_UART_Transmit(&huart1,
                        (uint8_t *)"RESET DONE\r\n",
                        strlen("RESET DONE\r\n"),
                        100);

      HAL_Delay(1000);
    }

    snprintf(line1, sizeof(line1),
             "AX:%d AY:%d    ",
             ax,
             ay);

    snprintf(line2, sizeof(line2),
             "AZ:%d G:%d     ",
             az,
             g);

    lcd_put_cur(0, 0);
    lcd_send_string(line1);

    lcd_put_cur(1, 0);
    lcd_send_string(line2);

    if (accidentDetected)
    {
      snprintf(bleMsg, sizeof(bleMsg),
               "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:ACCIDENT\r\n",
               ax, ay, az, g);
    }
    else
    {
      snprintf(bleMsg, sizeof(bleMsg),
               "AX:%d,AY:%d,AZ:%d,G:%d,STATUS:SAFE\r\n",
               ax, ay, az, g);
    }

    HAL_UART_Transmit(&huart1,
                      (uint8_t *)bleMsg,
                      strlen(bleMsg),
                      100);

    HAL_Delay(700);
  }
}

void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE2);

  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_NONE;

  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  RCC_ClkInitStruct.ClockType =
      RCC_CLOCKTYPE_HCLK |
      RCC_CLOCKTYPE_SYSCLK |
      RCC_CLOCKTYPE_PCLK1 |
      RCC_CLOCKTYPE_PCLK2;

  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_HSI;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_0) != HAL_OK)
  {
    Error_Handler();
  }
}

void Error_Handler(void)
{
  __disable_irq();

  while (1) {}
}

#ifdef USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line)
{
}
#endif

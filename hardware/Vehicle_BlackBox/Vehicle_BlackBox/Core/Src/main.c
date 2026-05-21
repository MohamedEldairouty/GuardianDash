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
#include "gpio.h"
#include "i2c-lcd.h"
#include "mpu6050.h"
#include "usart.h"
#include <stdio.h>

void SystemClock_Config(void);

int main(void)
{
  HAL_Init();

  SystemClock_Config();

  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  Usart2_Init();                      /* USART2 for the GuardianDash USB-serial bridge */

  HAL_Delay(500);

  Usart2_WriteString("\r\n[GuardianDash] Vehicle_BlackBox boot\r\n");

  lcd_init();
  HAL_Delay(100);
  lcd_clear();

  MPU6050_t MPU6050;

  lcd_put_cur(0, 0);
  lcd_send_string("BLACKBOX READY");
  lcd_put_cur(1, 0);
  lcd_send_string("MPU TESTING...");
  HAL_Delay(1500);
  lcd_clear();

  if (MPU6050_Init(&hi2c1) == 0)
  {
    lcd_put_cur(0, 0);
    lcd_send_string("MPU6050 READY ");
    lcd_put_cur(1, 0);
    lcd_send_string("MONITORING... ");
  }
  else
  {
    lcd_put_cur(0, 0);
    lcd_send_string("MPU6050 ERROR ");
    lcd_put_cur(1, 0);
    lcd_send_string("CHECK WIRING  ");

    while (1)
    {
    }
  }

  HAL_Delay(1500);
  lcd_clear();

  char line1[32];
  char line2[32];
  char uart_buf[96];

  while (1)
  {
    MPU6050_Read_Accel(&hi2c1, &MPU6050);

    /* ------------------------ LCD output (existing) ------------------------ */
    int g_int = (int)(MPU6050.Gforce * 100);

    snprintf(line1, sizeof(line1),
             "G:%d.%02d        ",
             g_int / 100,
             g_int % 100);

    if (MPU6050.Gforce > 1.50f)
    {
      snprintf(line2, sizeof(line2),
               "STATUS: UNSAFE  ");
    }
    else
    {
      snprintf(line2, sizeof(line2),
               "STATUS: SAFE    ");
    }

    lcd_put_cur(0, 0);
    lcd_send_string(line1);

    lcd_put_cur(1, 0);
    lcd_send_string(line2);

    /* ---------------------- UART output for the bridge ---------------------
     * Format expected by bridge/bridge.js parser:
     *     G:1.23,X:0.05,Y:-0.01,Z:1.00\r\n
     * We avoid %f (which would require linking float printf) by emitting
     * each value as <integer>.<two-digit-fraction>, with a leading '-' when
     * needed.
     */
    int g_w   = (int)MPU6050.Gforce;
    int g_f   = (int)((MPU6050.Gforce - (float)g_w) * 100.0f);
    if (g_f < 0) g_f = -g_f;

    int ax_w  = (int)MPU6050.Ax;
    int ax_f  = (int)((MPU6050.Ax - (float)ax_w) * 100.0f);
    if (ax_f < 0) ax_f = -ax_f;
    const char *ax_sign = (MPU6050.Ax < 0 && ax_w == 0) ? "-" : "";

    int ay_w  = (int)MPU6050.Ay;
    int ay_f  = (int)((MPU6050.Ay - (float)ay_w) * 100.0f);
    if (ay_f < 0) ay_f = -ay_f;
    const char *ay_sign = (MPU6050.Ay < 0 && ay_w == 0) ? "-" : "";

    int az_w  = (int)MPU6050.Az;
    int az_f  = (int)((MPU6050.Az - (float)az_w) * 100.0f);
    if (az_f < 0) az_f = -az_f;
    const char *az_sign = (MPU6050.Az < 0 && az_w == 0) ? "-" : "";

    snprintf(uart_buf, sizeof(uart_buf),
             "G:%d.%02d,X:%s%d.%02d,Y:%s%d.%02d,Z:%s%d.%02d\r\n",
             g_w, g_f,
             ax_sign, ax_w, ax_f,
             ay_sign, ay_w, ay_f,
             az_sign, az_w, az_f);
    Usart2_WriteString(uart_buf);

    HAL_Delay(500);
  }
}

void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  __HAL_RCC_PWR_CLK_ENABLE();

  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE2);

  RCC_OscInitStruct.OscillatorType =
      RCC_OSCILLATORTYPE_HSI;

  RCC_OscInitStruct.HSIState =
      RCC_HSI_ON;

  RCC_OscInitStruct.HSICalibrationValue =
      RCC_HSICALIBRATION_DEFAULT;

  RCC_OscInitStruct.PLL.PLLState =
      RCC_PLL_NONE;

  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  RCC_ClkInitStruct.ClockType =
      RCC_CLOCKTYPE_HCLK |
      RCC_CLOCKTYPE_SYSCLK |
      RCC_CLOCKTYPE_PCLK1 |
      RCC_CLOCKTYPE_PCLK2;

  RCC_ClkInitStruct.SYSCLKSource =
      RCC_SYSCLKSOURCE_HSI;

  RCC_ClkInitStruct.AHBCLKDivider =
      RCC_SYSCLK_DIV1;

  RCC_ClkInitStruct.APB1CLKDivider =
      RCC_HCLK_DIV1;

  RCC_ClkInitStruct.APB2CLKDivider =
      RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct,
                          FLASH_LATENCY_0) != HAL_OK)
  {
    Error_Handler();
  }
}

void Error_Handler(void)
{
  __disable_irq();

  while (1)
  {
  }
}

#ifdef USE_FULL_ASSERT

void assert_failed(uint8_t *file, uint32_t line)
{
}

#endif

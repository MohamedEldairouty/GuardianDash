#include "main.h"
#include "i2c.h"
#include "usart.h"
#include "gpio.h"
#include "tim.h"

#include "i2c-lcd.h"
#include "mpu6050.h"

#include <stdio.h>
#include <string.h>

void SystemClock_Config(void);

#define HALL_PORT GPIOA
#define HALL_PIN  GPIO_PIN_0

#define NORMAL_SPEED 45
#define FAST_SPEED   65

typedef enum {
  NORMAL_1,
  HARSH_BRAKE,
  STOP_1,
  NORMAL_2,
  SLOW_BRAKE,
  HARSH_ACCEL,
  CRUISE_FAST
} DemoPhase;

void Hall_Init_Manual(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  __HAL_RCC_GPIOA_CLK_ENABLE();

  GPIO_InitStruct.Pin = HALL_PIN;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_PULLUP;
  HAL_GPIO_Init(HALL_PORT, &GPIO_InitStruct);
}

void Motor_SetSpeed(uint8_t speed)
{
  __HAL_TIM_SET_COMPARE(&htim4, TIM_CHANNEL_3, speed);
  __HAL_TIM_SET_COMPARE(&htim4, TIM_CHANNEL_4, speed);
}

void Motors_Forward(void)
{
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12, GPIO_PIN_SET);
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_13, GPIO_PIN_RESET);

  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_14, GPIO_PIN_SET);
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_15, GPIO_PIN_RESET);
}

void Motors_Stop(void)
{
  Motor_SetSpeed(0);

  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12, GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_13, GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_14, GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_15, GPIO_PIN_RESET);
}

int main(void)
{
  HAL_Init();
  SystemClock_Config();

  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_USART1_UART_Init();
  MX_TIM4_Init();

  Hall_Init_Manual();

  HAL_TIM_PWM_Start(&htim4, TIM_CHANNEL_3);
  HAL_TIM_PWM_Start(&htim4, TIM_CHANNEL_4);

  HAL_Delay(1000);

  lcd_init();
  HAL_Delay(200);
  lcd_clear();

  MPU6050_t MPU6050;

  char line1[32];
  char line2[32];
  char bleMsg[200];

  uint32_t phaseStart = HAL_GetTick();
  DemoPhase phase = NORMAL_1;

  uint8_t motorSpeed = NORMAL_SPEED;
  uint8_t hallState = 1;
  uint8_t lastHallState = 1;
  uint32_t pulseCount = 0;

  lcd_put_cur(0, 0);
  lcd_send_string("BLACKBOX READY ");
  lcd_put_cur(1, 0);
  lcd_send_string("DEMO STARTING  ");

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

  Motors_Forward();
  Motor_SetSpeed(NORMAL_SPEED);

  while (1)
  {
    uint32_t now = HAL_GetTick();
    uint32_t elapsed = now - phaseStart;

    char eventName[20] = "NORMAL";
    char alertName[20] = "NONE";

    switch (phase)
    {
      case NORMAL_1:
        motorSpeed = NORMAL_SPEED;
        strcpy(eventName, "NORMAL_DRIVE");

        if (elapsed >= 3000)
        {
          phase = HARSH_BRAKE;
          phaseStart = now;
        }
        break;

      case HARSH_BRAKE:
        strcpy(eventName, "HARSH_BRAKE");
        strcpy(alertName, "HARSH_BRAKE");

        if (elapsed <= 1000)
          motorSpeed = NORMAL_SPEED - ((NORMAL_SPEED * elapsed) / 1000);
        else
          motorSpeed = 0;

        if (elapsed >= 1000)
        {
          phase = STOP_1;
          phaseStart = now;
        }
        break;

      case STOP_1:
        motorSpeed = 0;
        strcpy(eventName, "STOP");

        if (elapsed >= 2000)
        {
          phase = NORMAL_2;
          phaseStart = now;
        }
        break;

      case NORMAL_2:
        motorSpeed = NORMAL_SPEED;
        strcpy(eventName, "NORMAL_DRIVE");

        if (elapsed >= 3000)
        {
          phase = SLOW_BRAKE;
          phaseStart = now;
        }
        break;

      case SLOW_BRAKE:
        strcpy(eventName, "SLOW_BRAKE");

        if (elapsed <= 3000)
          motorSpeed = NORMAL_SPEED - ((NORMAL_SPEED * elapsed) / 3000);
        else
          motorSpeed = 0;

        if (elapsed >= 3000)
        {
          phase = HARSH_ACCEL;
          phaseStart = now;
        }
        break;

      case HARSH_ACCEL:
        strcpy(eventName, "HARSH_ACCEL");
        strcpy(alertName, "HARSH_ACCEL");

        if (elapsed <= 1000)
          motorSpeed = (FAST_SPEED * elapsed) / 1000;
        else
          motorSpeed = FAST_SPEED;

        if (elapsed >= 1000)
        {
          phase = CRUISE_FAST;
          phaseStart = now;
        }
        break;

      case CRUISE_FAST:
        motorSpeed = FAST_SPEED;
        strcpy(eventName, "FAST_CRUISE");

        if (elapsed >= 2000)
        {
          phase = NORMAL_1;
          phaseStart = now;
          pulseCount = 0;
        }
        break;
    }

    Motors_Forward();
    Motor_SetSpeed(motorSpeed);

    MPU6050_Read_Accel(&hi2c1, &MPU6050);

    hallState = HAL_GPIO_ReadPin(HALL_PORT, HALL_PIN);

    if (lastHallState == 1 && hallState == 0)
    {
      pulseCount++;
    }

    lastHallState = hallState;

    int ax = (int)(MPU6050.Ax * 100);
    int ay = (int)(MPU6050.Ay * 100);
    int az = (int)(MPU6050.Az * 100);
    int g  = (int)(MPU6050.Gforce * 100);

    snprintf(line1, sizeof(line1), "PWM:%d H:%d     ", motorSpeed, hallState);
    snprintf(line2, sizeof(line2), "P:%lu %s", pulseCount, eventName);

    lcd_put_cur(0, 0);
    lcd_send_string(line1);

    lcd_put_cur(1, 0);
    lcd_send_string(line2);

    snprintf(bleMsg, sizeof(bleMsg),
             "T:%lu,AX:%d,AY:%d,AZ:%d,G:%d,HALL:%d,PULSE:%lu,PWM:%d,EVENT:%s,ALERT:%s\r\n",
             now, ax, ay, az, g, hallState, pulseCount, motorSpeed, eventName, alertName);

    HAL_UART_Transmit(&huart1,
                      (uint8_t *)bleMsg,
                      strlen(bleMsg),
                      100);

    HAL_Delay(100);
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

  while (1)
  {
  }
}

#ifdef USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line)
{
}
#endif

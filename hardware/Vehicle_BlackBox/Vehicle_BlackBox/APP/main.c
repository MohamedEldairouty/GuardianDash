#include "../Inc/MCAL/UART/UART.h"

int main(void){
    UART_Init();
    while(1){
        UART_SendString("HELLO HM-10\r\n");
        for(volatile int i=0; i<1000000;i++); // crude delay
    }
}

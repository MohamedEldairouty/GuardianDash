#ifndef _STD_TYPES_H
#define _STD_TYPES_H

typedef unsigned char uint8;
typedef unsigned short int uint16;
typedef unsigned long int uint32;
typedef signed char int8;
typedef signed short int int16;
typedef signed long int int32;
typedef float float32;
typedef double float64;
typedef long double float80;

#define STD_HIGH 0x01
#define STD_LOW  0x00
#define STD_ON   1
#define STD_OFF  0
#define STD_ACTIVE 1u
#define STD_IDLE 0u

typedef enum{
    E_NOT_OK,
    E_OK
} Std_ReturnType;

#define E_OK 0u
#define E_NOT_OK 1u

typedef union{
    struct{
        uint8 uint8b0 :1;
        uint8 uint8b1 :1;
        uint8 uint8b2 :1;
        uint8 uint8b3 :1;
        uint8 uint8b4 :1;
        uint8 uint8b5 :1;
        uint8 uint8b6 :1;
        uint8 uint8b7 :1;
    } strBit;
    uint8 uint8Byte;
} STD_tenuPort;

#endif

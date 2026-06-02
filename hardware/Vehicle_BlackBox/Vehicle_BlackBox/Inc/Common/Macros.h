#ifndef MACROS_H
#define MACROS_H

#define SET_BIT(Byte,Pos) (Byte |= (1<<Pos))
#define CLEAR_BIT(Byte,Pos) (Byte &= ~(1<<Pos))
#define TOGGLE_BIT(Byte,Pos) (Byte ^= (1<<Pos))
#define GET_BIT(Reg,Bit) ((Reg & (1<<Bit))>>Bit)

#endif

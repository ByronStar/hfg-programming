/* DUNGEON-- MAIN PROGRAM */

/*COPYRIGHT 1980, INFOCOM COMPUTERS AND COMMUNICATIONS, CAMBRIDGE MA. 02142*/
/* ALL RIGHTS RESERVED, COMMERCIAL USAGE STRICTLY PROHIBITED */
/* WRITTEN BY R. M. SUPNIK */

#define EXTERN
#define INIT

#include "funcs.h"
#include "vars.h"
// #include "stdio.h"

void main(argc, argv)
int argc;
char **argv;
{
/* 1) INITIALIZE DATA STRUCTURES */
/* 2) PLAY GAME */
// int i;
// printf("argc: %d\n", argc);
// for(i=0; i < argc; i++) {
//   printf("argv[%d]: %s\n", i, argv[i]);
// }

    if (init_(argc, argv)) {
	game_();
    }
/* 						!IF INIT, PLAY GAME. */
    exit_();
/* 						!DONE */
} /* MAIN__ */

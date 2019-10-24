SET rc=0
:restart
node gameserver.js %*
IF ERRORLEVEL 0 GOTO restart

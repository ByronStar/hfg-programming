#!/usr/bin/env bash
rc=0
while [ $rc = 0 ]; do
  #cp ~/bitbucket/hfg-programming/game/client/progsp_game.html ../client
  #cp ~/bitbucket/hfg-programming/game/client/js/progsp_game.js ../client/js
  #cp ~/bitbucket/hfg-programming/game/client/lib/gameclient.js ../client/lib
  #cp ~/bitbucket/hfg-programming/game/server/gameserver.js .
  #cp ~/bitbucket/hfg-programming/game/server/progsp* .
  node gameserver.js $*
  rc=$?
done

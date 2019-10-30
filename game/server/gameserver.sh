#!/usr/bin/env sh
rc=0
#dir=~/bitbucket/hfg-programming/
dir=~/github/hfg-programming/
while [ $rc = 0 ]; do
  #cp ${dir}game/client/progsp_game.html ../client
  #cp ${dir}game/client/js/progsp_game.js ../client/js
  #cp ${dir}game/client/lib/gameclient.js ../client/lib
  #cp ${dir}game/server/gameserver.js .
  #cp ${dir}game/server/progsp* .
  #cp ${dir}game/server/rootCA.crt .
  node gameserver.js $*
  rc=$?
done

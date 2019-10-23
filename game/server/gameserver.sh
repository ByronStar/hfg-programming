#!/usr/bin/env bash
rc=0
while [ $rc = 0 ]; do
  #cp -pr ~/bitbucket/hfg-programming/game/client ..
  #cp ~/bitbucket/hfg-programming/game/server/gameserver.js .
  node gameserver.js $*
  rc=$?
done

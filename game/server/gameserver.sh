#!/usr/bin/env sh
# Create key
openssl genrsa -out progsp.hfg-gmuend.de.key 2048
# signing (csr)
openssl req -utf8 -config progsp.hfg-gmuend.de.conf -new -key progsp.hfg-gmuend.de.key -out progsp.hfg-gmuend.de.csr
# Create certificate
openssl x509 -req -in progsp.hfg-gmuend.de.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial -out progsp.hfg-gmuend.de.pem -days 365 -sha256

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

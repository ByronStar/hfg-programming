rc=0
if [ -d ~/bitbucket/hfg-programming/ ];then
  DIR=~/bitbucket/hfg-programming/
else
  DIR=~/github/hfg-programming/
fi
echo ${DIR}
# k8s container setup
if [ -f gamestate0.json ]; then
  cp gamestate0.json gamestate.json
fi
# rm progsp.hfg-gmuend.de.*
while [ $rc = 0 ]; do
  #cp ${DIR}game/client/progsp_game.html ../client
  #cp ${DIR}game/client/js/progsp_game.js ../client/js
  cp ${DIR}game/client/lib/gameclient.js ../client/lib
  #cp ${DIR}game/server/gamestate.json .
  cp ${DIR}game/server/gameserver.js .
  node gameserver.js $*
  rc=$?
done

#!/usr/bin/env bash
if [ -d ~/bitbucket/hfg-programming/ ];then
  DIR=~/bitbucket/hfg-programming/
else
  DIR=~/github/hfg-programming/
fi
rm progsp_game.zip
zip -r progsp_game.zip game -i 'game/client/*' 'game/server/*' -x '*/benno.*' '*/nils.*' '*/node_modules/*' '*/.DS_Store' game/server/gamestate.json game/server/nginx.conf
#zip -r mpg_client.zip client -x '*/benno.*' '*/nils.*'
#zip -r mpg_server.zip server -x '*/node_modules/*' server/gamestate.json server/nginx.conf

# test the package
cd ~/private
unzip -o ${DIR}progsp_game.zip
cd -

wscat -n -c wss://127.0.0.1:8091 -x '{"id":"RESTART","from":"wscat script","ts":'$(date +%s)',"data":{"rc":0}}'

# https://medium.com/@auchenberg/detecting-multi-touch-trackpad-gestures-in-javascript-a2505babb10e
# https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Using_Touch_Events
# https://stackoverflow.com/questions/29173810/detect-if-mouse-move-in-circle-way

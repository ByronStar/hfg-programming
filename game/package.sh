#!/usr/bin/env bash
dir=~/bitbucket/hfg-programming/
#dir=~/github/hfg-programming/
rm mpg_*.zip
zip -r mpg_client.zip client -x '*/benno.*' '*/nils.*'
zip -r mpg_server.zip server -x '*/node_modules/*' server/gamestate.json server/nginx.conf

# test the package
cd ~/private/game
unzip -o ${dir}game/mpg_client.zip
unzip -o ${dir}game/mpg_server.zip
cd -

# https://medium.com/@auchenberg/detecting-multi-touch-trackpad-gestures-in-javascript-a2505babb10e
# https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Using_Touch_Events
# https://stackoverflow.com/questions/29173810/detect-if-mouse-move-in-circle-way

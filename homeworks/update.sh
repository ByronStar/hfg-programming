#!/usr/bin/env bash
scp -P 11222 server/homeworks.js pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server
scp -P 11222 server/homeworks.sh pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server
wscat -c wss://byron.hopto.org:11204 -x '{"id":"RESTART","from":"wscat script","ts":1584008662853,"data":{"rc":0}}'

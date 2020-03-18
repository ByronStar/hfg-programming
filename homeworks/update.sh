#!/usr/bin/env bash
scp -P 11222 server/homeworks.js pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server
scp -P 11222 student/lib/homeworks.js pi@byron.hopto.org:/home/pi/www/rpi/homeworks/students/shared/lib
# scp -P 11222 student/css/progsp.css pi@byron.hopto.org:/home/pi/www/rpi/homeworks/students/shared/css
# scp -P 11222 student/img/x.png pi@byron.hopto.org:/home/pi/www/rpi/homeworks/students/shared/img
# scp -P 11222 student/img/r.png pi@byron.hopto.org:/home/pi/www/rpi/homeworks/students/shared/img
# scp -P 11222 student/img/g.png pi@byron.hopto.org:/home/pi/www/rpi/homeworks/students/shared/img
# scp -P 11222 student/img/y.png pi@byron.hopto.org:/home/pi/www/rpi/homeworks/students/shared/img
# scp -P 11222 student/favicon.ico pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server
#scp -P 11222 server/studentWS1920.txt pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server/students.txt
#scp -P 11222 server/homeworks.sh pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server
#scp -P 11222 server/homeworks.json pi@byron.hopto.org:/home/pi/www/rpi/homeworks/server
wscat -c wss://byron.hopto.org:11204 -x '{"id":"RESTART","from":"wscat script","ts":1584008662853,"data":{"rc":0}}'

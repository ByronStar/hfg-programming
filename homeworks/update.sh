#!/usr/bin/env bash
#HOST=pi@byron.hopto.org
#DIR=/home/pi/www/rpi/homeworks
#PORT=-P 11222

HOST=node@hfg.hopto.org
DIR=/home/node/homeworks
PORT=

scp ${PORT} server/homeworks.js ${HOST}:${DIR}/server
# scp ${PORT} server/studentSoSe20.txt ${HOST}:${DIR}/server/students.txt
# scp ${PORT} server/package.json ${HOST}:${DIR}/server
# scp ${PORT} server/homeworks.sh ${HOST}:${DIR}/server
# scp ${PORT} student/favicon.ico ${HOST}:${DIR}/server
scp ${PORT} server/homeworks.json ${HOST}:${DIR}/server


# cp student/lib/homeworks.js /Users/benno/Desktop/student/lib
# scp ${PORT} student/lib/homeworks.js ${HOST}:${DIR}/students/shared/lib
# zip -r student.zip student -x */*neu.html */data/*.id

# scp ${PORT} student/css/progsp.css ${HOST}:${DIR}/students/shared/css
# scp ${PORT} student/img/x.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/r.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/g.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/y.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/arrow_d.png ${HOST}:${DIR}/students/shared/img

wscat -c wss://hfg.hopto.org:11204 -x '{"id":"RESTART","from":"wscat script","ts":1584008662853,"data":{"rc":0}}'

#!/usr/bin/env bash
#HOST=pi@byron.hopto.org
#DIR=/home/pi/www/rpi/homeworks
#PORT=-P 11222

HOST=node@hfg.hopto.org
DIR=/home/node/homeworks
PORT=

# scp ${PORT} server/studentSoSe20.txt ${HOST}:${DIR}/server/students.txt
# scp ${PORT} server/package.json ${HOST}:${DIR}/server
# scp ${PORT} server/homeworks.sh ${HOST}:${DIR}/server
# scp ${PORT} student/favicon.ico ${HOST}:${DIR}/server

# scp ${PORT} student/css/progsp.css ${HOST}:${DIR}/students/shared/css
# scp ${PORT} student/img/x.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/r.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/g.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/y.png ${HOST}:${DIR}/students/shared/img
# scp ${PORT} student/img/arrow_d.png ${HOST}:${DIR}/students/shared/img

# cp student/lib/homeworks.js /Users/benno/Desktop/student/lib
# scp ${PORT} student/lib/homeworks.js ${HOST}:${DIR}/students/shared/lib
# zip -r student.zip student -x */*neu.html */data/*.id

# scp ${PORT} server/homeworks.json ${HOST}:${DIR}/server
# scp ${PORT} ${HOST}:${DIR}/server/homeworks.json server
scp ${PORT} server/homeworks.js ${HOST}:${DIR}/server
wscat -c wss://hfg.hopto.org:11204 -x '{"id":"RESTART","from":"wscat script","ts":'$(date +%s)',"data":{"rc":0}}'
# scp ${PORT} ${HOST}:${DIR}/server/homeworks.log_20200502002056 server
scp ${PORT} ${HOST}:${DIR}/server/homeworks.log server

# wscat -c wss://hfg.hopto.org:11204 -x '{"id":"ADDUSER","from":"wscat script","ts":'$(date +%s)',"data":{"firstname":"Benedikt","name":"Groß","group":"IG1"}}'

# curl -X POST --data-urlencode "payload={\"channel\":\"#2020ss-ig1-programmiersprachen-1\",\"username\":\"HomeworksServer\",\"text\":\"Es gibt eine neue Version der Homeworks Library. Bitte von https://hfg.hopto.org:11204/homeworks.js herunterladen und in euren `student/lib` Ordner kopieren.\"}" https://hooks.slack.com/services/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
# curl -X POST --data-urlencode "payload={\"channel\":\"@benno.staebler\",\"username\":\"HomeworksServer\",\"text\":\"Es gibt eine neue Version der Homeworks Library. Bitte von https://hfg.hopto.org:11204/homeworks.js herunterladen und in euren 'student/lib' Ordner kopieren.\"}" https://hooks.slack.com/services/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

#!/usr/bin/env bash
#HOST=pi@byron.hopto.org
#DIR=/home/pi/www/rpi/homeworks
#PORT=-P 11222

HOST=node@hfg.hopto.org
DIR=/home/node/homeworks
PORT=

MODE=${1:-${MODE:-help}}

case "${MODE}" in
  compile)
  ;;
# Save data
#scp ${PORT} ${HOST}:${DIR}/students.zip studentSoSe20.zip
#scp ${PORT} ${HOST}:${DIR}/server.zip serverSoSe20.zip


# intial setup
# scp ${PORT} server/package.json ${HOST}:${DIR}/server
# scp ${PORT} STEP/favicon.ico ${HOST}:${DIR}/server
# scp ${PORT} server/homeworks.sh ${HOST}:${DIR}/server

# semester setup OLD
#scp ${PORT} student/lib/homeworks.js ${HOST}:${DIR}/students/shared/lib
#scp ${PORT} student/lib/p5.min.js ${HOST}:${DIR}/students/shared/lib
#scp ${PORT} student/lib/p5.sound.min.js ${HOST}:${DIR}/students/shared/lib
#scp ${PORT} student/lib/p5.sound.min.js.map ${HOST}:${DIR}/students/shared/lib
#scp ${PORT} student/lib/matter.js ${HOST}:${DIR}/students/shared/lib
#scp ${PORT} student/css/progsp.css ${HOST}:${DIR}/students/shared/css
#scp ${PORT} student/img/x.png ${HOST}:${DIR}/students/shared/img
#scp ${PORT} student/img/r.png ${HOST}:${DIR}/students/shared/img
#scp ${PORT} student/img/g.png ${HOST}:${DIR}/students/shared/img
#scp ${PORT} student/img/y.png ${HOST}:${DIR}/students/shared/img
#scp ${PORT} student/img/arrow_d.png ${HOST}:${DIR}/students/shared/img

  # semester setup NEW
  setup)
    # upload shared files
    scp ${PORT} STEP/libraries/decomp.min.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/homeworks.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/matter.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/p5.min.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/p5.sound.min.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/p5.sound.min.js.map ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/pathseg.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/libraries/qrcode.js ${HOST}:${DIR}/students/shared/libraries
    scp ${PORT} STEP/css/ps_step.css ${HOST}:${DIR}/students/shared/css
    scp ${PORT} STEP/img/x.png ${HOST}:${DIR}/students/shared/img
    scp ${PORT} STEP/img/r.png ${HOST}:${DIR}/students/shared/img
    scp ${PORT} STEP/img/g.png ${HOST}:${DIR}/students/shared/img
    scp ${PORT} STEP/img/y.png ${HOST}:${DIR}/students/shared/img
  ;;

# refresh test setup
#cp STEP/libraries/homeworks.js /Users/benno/Desktop/STEP/libraries

  # create students package
  package)
    # upload students list
    rm STEP.zip
    zip -r STEP.zip STEP -x "STEP/data/*.id" -x "STEP**.DS_Store"
  ;;

# replace transactional data
# scp ${PORT} server/homeworks.json ${HOST}:${DIR}/server

  # upload new server (and restart)
  upd_server)
    # upload students list
    scp ${PORT} server/studentSoSe21.txt ${HOST}:${DIR}/server/students.txt
    scp ${PORT} server/homeworks.js ${HOST}:${DIR}/server
    wscat -c wss://hfg.hopto.org:11204 -x '{"id":"RESTART","from":"wscat script","ts":'$(date +%s)',"data":{"rc":0}}'
  ;;

# save transactional data
# scp ${PORT} ${HOST}:${DIR}/server/homeworks.json server
# scp ${PORT} ${HOST}:${DIR}/server/homeworks.json server/homeworks_crash.json

# update transactional data
#scp ${PORT} ${HOST}:${DIR}/server/homeworks.json server
#cd server
#node repair.js
#cd ..
#scp ${PORT} server/homeworks.json ${HOST}:${DIR}/server
#wscat -c wss://hfg.hopto.org:11204 -x '{"id":"RESTART","from":"wscat script","ts":'$(date +%s)',"data":{"rc":0}}'

# scp ${PORT} ${HOST}:${DIR}/server/homeworks.json_20200525091424 server

# save logs
# scp ${PORT} ${HOST}:${DIR}/server/homeworks.log server
# scp ${PORT} ${HOST}:${DIR}/server/homeworks.log_20200522083028 server

# get students file
#scp ${PORT} ${HOST}:${DIR}/students/nina.bacher/progsp_4.html progsp_4nina.html

  # add new user
  adduser)
    #wscat -c wss://hfg.hopto.org:11204 -x '{"id":"ADDUSER","from":"wscat script","ts":'$(date +%s)',"data":{"firstname":"Benedikt","name":"Groß","group":"IG1"}}'
    #wscat -c wss://hfg.hopto.org:11204 -x '{"id":"ADDUSER","from":"wscat script","ts":'$(date +%s)',"data":{"firstname":"Amanda","name":"Grigoleit","group":"IG1A"}}'
    #wscat -c wss://hfg.hopto.org:11204 -x '{"id":"ADDUSER","from":"wscat script","ts":'$(date +%s)',"data":{"firstname":"Rebekka","name":"Romer","group":"IG1A"}}'
  ;;
  *)
    echo "\"${MODE}\" unknown"
    exit 1
  ;;
esac

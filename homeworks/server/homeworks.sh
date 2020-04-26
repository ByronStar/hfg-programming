#!/usr/bin/env bash
rc=0
while [ $rc = 0 ]; do
  echo "Homeworks Server"
  SUF=$(date +"%Y%m%d%H%M%S")
  cp "homeworks.json" "homeworks.json_"${SUF}
  if [ -f "homeworks.log" ];then
    cp "homeworks.log" "homeworks.log_"${SUF}
  fi
  node homeworks.js $*
  rc=$?
done

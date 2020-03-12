#!/usr/bin/env bash
rc=0
while [ $rc = 0 ]; do
  echo "Homeworks Server"
  node homeworks.js $*
  rc=$?
done

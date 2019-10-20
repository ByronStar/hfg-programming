#!/usr/bin/env bash
rc=0
while [ $rc = 0 ]; do
  node gameserver.js
  rc=$?
done

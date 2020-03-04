#!/usr/bin/env bash
for tle in starlink gps glonass meteosat intelsat ses orbcomm iss cpf;do
# for tle in starlink iss;do
  echo "Load ${tle} TLEs"
  wget -q -O - https://celestrak.com/NORAD/elements/supplemental/${tle}.txt | tr -d '\r' | awk -f tle2json.awk d="$(date +'%F %T %Z')" file=${tle}.txt > data/${tle}.js
  #wget -q -O - https://celestrak.com/NORAD/elements/supplemental/${tle}.txt | tr -d '\r' > ${tle}.txt
  #awk -f tle2json.awk d="$(date +'%F %T %Z')" ${tle}.txt > data/${tle}.js
done
#curl https://celestrak.com/NORAD/elements/supplemental/starlink.txt| tr -d '\r' | awk -f tle2json.awk > js/starlink.js
#https://www.celestrak.com/NORAD/elements/

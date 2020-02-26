#!/usr/bin/env bash
for tle in starlink gps glonass meteosat intelsat ses orbcomm iss cpf;do
  wget -q -O - https://celestrak.com/NORAD/elements/supplemental/${tle}.txt | tr -d '\r' | awk -f tle2json.awk > data/${tle}.js
done
#curl https://celestrak.com/NORAD/elements/supplemental/starlink.txt| tr -d '\r' | awk -f tle2json.awk > js/starlink.js
#https://www.celestrak.com/NORAD/elements/

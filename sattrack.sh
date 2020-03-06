#!/usr/bin/env bash
URL=https://celestrak.com/NORAD/elements
for tle in starlink gps glonass meteosat intelsat ses orbcomm iss cpf;do
  echo "Load ${tle} TLEs"
  wget -q -O - ${URL}/supplemental/${tle}.txt | tr -d '\r' | awk -f tle2json.awk d="$(date +'%F %T %Z')" file=${tle}.txt > data/${tle}.js
  #wget -q -O - https://celestrak.com/NORAD/elements/supplemental/${tle}.txt | tr -d '\r' > ${tle}.txt
  #awk -f tle2json.awk d="$(date +'%F %T %Z')" ${tle}.txt > data/${tle}.js
done

for tle in iridium iridium-33-debris galileo glo-ops gps-ops active;do
  echo "Load ${tle} TLEs"
  wget -q -O - ${URL}/${tle}.txt | tr -d '\r' | awk -f tle2json.awk d="$(date +'%F %T %Z')" file=${tle}.txt > data/${tle}.js
done

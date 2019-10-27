#!/usr/bin/env bash
openssl req -utf8 -config progsp.hfg-gmuend.de.conf -new -sha256 -newkey rsa:2048 -nodes -keyout progsp.hfg-gmuend.de.key -x509 -days 365 -out progsp.hfg-gmuend.de.pem
#openssl pkcs12 -nocerts -in my.p12 -out .key.pem.
#openssl pkcs12 -clcerts -nokeys -in my.p12 -out .cert.pem
#scp pi@192.168.2.197:/etc/letsencrypt/live/byron.hopto.org/privkey.pem .
#scp pi@192.168.2.197:/etc/letsencrypt/live/byron.hopto.org/fullchain.pem .

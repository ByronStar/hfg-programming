#!/usr/bin/env bash
#openssl genrsa -des3 -out rootCA.key 4096
# Root CA
# Create key
#  openssl genrsa -out rootCA.key 4096
# Create certificate
openssl req -utf8 -config progsp.ca-hfg-gmuend.de.conf -x509 -new -nodes -key rootCA.key -sha256 -days 730 -out rootCA.crt

# Each Server
# Create key
openssl genrsa -out progsp.hfg-gmuend.de.key 2048
# signing (csr)
openssl req -utf8 -config progsp.hfg-gmuend.de.conf -new -key progsp.hfg-gmuend.de.key -out progsp.hfg-gmuend.de.csr
# Verify csr
openssl req -in progsp.hfg-gmuend.de.csr -noout -text
# Create certificate
openssl x509 -req -in progsp.hfg-gmuend.de.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial -out progsp.hfg-gmuend.de.pem -days 365 -sha256
# Verify certificate
openssl x509 -in progsp.hfg-gmuend.de.pem -text -noout

mv rootCA.crt ../server
mv progsp.hfg-gmuend.de.key ../server
mv progsp.hfg-gmuend.de.pem ../server

#openssl req -utf8 -config progsp.hfg-gmuend.de.conf -new -sha256 -newkey rsa:2048 -nodes -keyout progsp.hfg-gmuend.de.key -x509 -days 365 -out progsp.hfg-gmuend.de.pem

#openssl pkcs12 -nocerts -in my.p12 -out .key.pem.
#openssl pkcs12 -clcerts -nokeys -in my.p12 -out .cert.pem
#scp pi@192.168.2.197:/etc/letsencrypt/live/byron.hopto.org/privkey.pem .
#scp pi@192.168.2.197:/etc/letsencrypt/live/byron.hopto.org/fullchain.pem .

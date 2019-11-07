#!/usr/bin/env bash
docker build -t byronstar/hfg-programming:latest .
docker push byronstar/hfg-programming:latest
kubectl delete -f k8s/hfg-deploy.yaml
kubectl create -f k8s/hfg-deploy.yaml

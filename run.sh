#!/bin/sh
crond -f &
([ -f values.yaml ] && python3 deployment_util/render.py values.yaml && echo "Use values.yaml") || (python3 deployment_util/render.py sample.yaml && echo "Use sample.yaml")
python3 deployment_util/healthz.py &
node -r source-map-support/register dist/start.js &
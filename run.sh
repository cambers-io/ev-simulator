#!/bin/sh
[ -f values.yaml ] && python3 render.py values.yaml
python3 healthz.py &
node -r source-map-support/register dist/start.js

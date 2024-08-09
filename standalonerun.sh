#!/bin/sh
[ -f values.yaml ] && python3 render.py values.yaml
node -r source-map-support/register dist/start.js

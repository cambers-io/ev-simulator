#!/bin/sh

docker buildx build --platform=linux/amd64 -t ev-simulator:$1 .
# Check if values.yaml exists, if not, create it from sample.yaml
if [ ! -f values.yaml ]; then
  cp sample.yaml values.yaml
  echo "Created values.yaml from sample.yaml"
fi
case "$2" in
  "shell")
    docker run -it -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$1 /bin/sh
    ;;
  "sample")
    docker run -t -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$1
    ;;
  "run")
    docker run -t -v $(pwd)/values.yaml:/usr/app/values.yaml ev-simulator:$1
    ;;
  "build")
    echo "Just building without running."
    ;;
  *)
    echo "Usage: $0 {shell|run|sample}"
    exit 1
    ;;
esac
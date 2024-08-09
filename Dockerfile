FROM node:16.3.0-alpine as builder

WORKDIR /usr/builder

COPY package.json package-lock.json ./

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install
COPY tsconfig.json rollup.config.js ./
COPY src ./src
COPY config.json ./src/assets/config.json
RUN npm run build

FROM node:16.3.0-alpine

RUN apk update && apk add --no-cache python3 py3-pip
RUN pip3 install jinja2 pyyaml cherrypy

WORKDIR /usr/app

COPY --from=builder /usr/builder/node_modules ./node_modules
COPY --from=builder /usr/builder/dist ./dist
COPY render.py ./
COPY healthz.py ./
COPY run.sh ./
COPY README.md NOTICE LICENSE ./
RUN chmod +x run.sh

CMD /usr/app/run.sh

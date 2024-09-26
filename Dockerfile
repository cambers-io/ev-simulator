FROM node:20-alpine as builder

WORKDIR /usr/builder

COPY package.json package-lock.json ./

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install
COPY tsconfig.json rollup.config.js ./
COPY src ./src
COPY config.json ./src/assets/config.json
RUN npm run build

FROM node:20-alpine
EXPOSE 8080

RUN apk update && apk add --no-cache python3 py3-pip logrotate dcron bash
RUN pip3 install jinja2 pyyaml flask --break-system-packages

# Add a logrotate configuration file for your logs
RUN echo "/var/log/ev-simulator/ev-simulator.log {" > /etc/logrotate.d/ev-simulator \
    && echo "  missingok" >> /etc/logrotate.d/ev-simulator \
    && echo "  rotate 7" >> /etc/logrotate.d/ev-simulator \
    && echo "  compress" >> /etc/logrotate.d/ev-simulator \
    && echo "  notifempty" >> /etc/logrotate.d/ev-simulator \
    && echo "  create 640 root root" >> /etc/logrotate.d/ev-simulator \
    && echo "  copytruncate" >> /etc/logrotate.d/ev-simulator \
    && echo "}" >> /etc/logrotate.d/ev-simulator
RUN mkdir -p /var/log/ev-simulator
# Add a cron job to run logrotate periodically (every 15 minutes)
RUN echo "*/15 * * * * /usr/sbin/logrotate /etc/logrotate.d/ev-simulator" > /etc/crontabs/root

WORKDIR /usr/app

COPY --from=builder /usr/builder/node_modules ./node_modules
COPY --from=builder /usr/builder/dist ./dist
COPY deployment_util ./deployment_util
COPY sample.yaml ./
COPY run.sh ./
COPY README.md NOTICE LICENSE ./
RUN chmod +x run.sh

CMD ["sh", "-c", "/usr/app/run.sh | tee /var/log/ev-simulator/ev-simulator.log"]


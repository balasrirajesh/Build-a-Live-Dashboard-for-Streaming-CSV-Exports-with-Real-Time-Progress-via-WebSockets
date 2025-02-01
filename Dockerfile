FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/
COPY public/ ./public/

RUN mkdir -p /tmp/exports

EXPOSE 8080

CMD ["node", "src/server.js"]

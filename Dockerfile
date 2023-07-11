FROM node:lts-slim

ENV NODE_ENV production

ENV DEBUG 0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN npm ci --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "app.js"]

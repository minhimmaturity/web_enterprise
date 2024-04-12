FROM node:20-alpine as prod

WORKDIR /src



ENV env /src

COPY package*.json yarn*lock ./

COPY . .

RUN yarn install

CMD [ "node", "src/index.js" ]


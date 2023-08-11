FROM node:18-alpine

RUN apk add --update openssl && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src

COPY asconfig.json /
COPY package.json /
COPY post-as-build.mjs /
COPY tsconfig.api.json /
COPY tsconfig.lib.json /
COPY webpack.config.mjs /
COPY api ./api
COPY shared ./shared
COPY lib ./lib

USER root

RUN npm install

CMD npm run start:api

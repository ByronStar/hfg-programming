FROM node:alpine
RUN mkdir -p /usr/src/game
WORKDIR /usr/src/game
COPY client/ client/
COPY server/ server/

WORKDIR /usr/src/game/server
RUN npm install
RUN npm install -g wscat

EXPOSE 8090 8091

CMD ["npm", "start" ]

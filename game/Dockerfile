FROM node:alpine
RUN mkdir -p /usr/src/game
WORKDIR /usr/src/game
COPY client/ client/
COPY server/ server/

WORKDIR /usr/src/game/server
RUN npm install

EXPOSE 8091 11203 11204

CMD ["npm", "start" ]

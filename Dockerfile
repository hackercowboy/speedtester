FROM node:8

RUN apt-get update
RUN apt-get -y install redis-server

ADD . /app

RUN cd app;yarn install

CMD cd /app;bash -c "redis-server &";yarn start
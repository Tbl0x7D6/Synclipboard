FROM node:20.12-alpine

RUN mkdir -p /home/nodeapp

COPY . /home/nodeapp
WORKDIR /home/nodeapp

RUN npm install
RUN npm run build

ENV PORT=3000
ENV HOST=0.0.0.0
ENV MAX_FILE_SIZE=20mb

CMD npm start
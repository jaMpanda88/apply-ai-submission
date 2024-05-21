FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV MODEL_URL=https://storage.googleapis.com/save-model-990/model-in-prod/model.json

ENV PORT=3000

CMD ["npm", "start"]
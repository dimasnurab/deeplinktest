FROM node:16
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm uninstall -g serve

# RUN npm uninstall -g phantomjs

RUN npm install -g serve

# RUN npm install phantomjs

# RUN rm -rf /app/node_modules/node-sass

RUN npm install --production

# RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]



FROM mcr.microsoft.com/playwright:v1.53.1-jammy

WORKDIR /usr/src/app
COPY . ./

RUN npm install
RUN npm install apify

CMD ["node", "main.js"]

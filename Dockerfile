FROM apify/actor-node-playwright:16

COPY . ./
RUN npm install --omit=dev

CMD ["npm", "start"]

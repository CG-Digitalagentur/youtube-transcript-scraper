# Dockerfile
FROM mcr.microsoft.com/playwright:v1.53.1-jammy

WORKDIR /usr/src/app

# INSTALL BUILD TOOLS
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && apt-get clean

COPY . ./

RUN npm install

CMD ["node", "main.js"]

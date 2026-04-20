FROM node:20-bookworm-slim

# Install build dependencies and openssl
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/api

# Copy package files
COPY api/package*.json ./

# Copy prisma schema
COPY prisma ../prisma/

RUN npm install

# Copy the rest of the api source
COPY api/ .

RUN npm run build

ENV NODE_ENV=development

EXPOSE 4000

CMD ["npm", "start"]

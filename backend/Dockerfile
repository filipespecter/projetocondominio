FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

# Prisma generate precisa apenas de uma URL sintaticamente válida durante o build.
# A URL real é fornecida em runtime pelo env_file do Compose.
RUN DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma?schema=public" npx prisma generate

COPY src ./src
COPY tests ./tests

EXPOSE 3333

CMD ["npm", "start"]

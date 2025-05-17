FROM node:23-alpine

WORKDIR /app

RUN curl -fsSL https://bun.sh/install | bash

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bun run dev

CMD ["node", "dist/index.js"]
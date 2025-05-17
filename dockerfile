FROM node:23-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

RUN curl -fsSL https://bun.sh/install | bash

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bun run dev

CMD ["node", "dist/index.js"]
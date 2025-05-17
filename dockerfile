FROM node:23-alpine

# Create app directory
WORKDIR /app

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

RUN npm install -g bun

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bun run dev

CMD ["node", "dist/index.js"]
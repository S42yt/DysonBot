FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy all source files
COPY . .

# Install tsx globally for running TypeScript directly 
RUN bun install -g tsx

# Run TypeScript directly in development mode
CMD ["bun", "run", "dev"]
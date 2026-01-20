# Builder stage
FROM node:20-slim AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
# Restore dynamic API routes for standalone build
RUN ln -s /app/server/api_deprecated /app/app/api_legacy
# Ensure we build for standalone output
ENV NEXT_OUTPUT=standalone
RUN npm run build

# Runner stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Re-install better-sqlite3 for the runner env
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Setup data directory for persistence
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/conduit.db

EXPOSE 3000

CMD ["node", "server.js"]

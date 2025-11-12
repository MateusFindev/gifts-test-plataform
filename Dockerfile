# Simple single-stage image that keeps dev deps to run migrations at container start
FROM node:22.13.0-alpine

WORKDIR /app

# System deps
RUN apk add --no-cache bash python3 make g++

# Install pnpm
RUN npm i -g pnpm@10

# Copy manifests first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./
# Also copy patch files required by patch-package/pnpm
COPY patches ./patches

# Install all deps (incl. dev) so we can run build + drizzle at runtime
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build client and server explicitly (don't rely on possibly-missing scripts)
# 1) Client build with Vite -> client/dist
# 2) Server bundle with esbuild -> dist/index.js
RUN pnpm exec vite build &&     pnpm exec esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

ENV NODE_ENV=production     HOST=0.0.0.0

EXPOSE 3000

# On container start: apply migrations and start the server
CMD bash -lc 'pnpm run db:push && node dist/index.js'

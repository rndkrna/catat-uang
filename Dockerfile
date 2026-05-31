# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage — node:20-slim + libvips untuk sharp (OCR struk)
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY src/backend ./src/backend
COPY tsconfig.json ./

# Railway injects PORT — listen via src/backend/index.ts
CMD ["npx", "tsx", "src/backend/index.ts"]

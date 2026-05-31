# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY src/backend ./src/backend
COPY tsconfig.json ./

# Platform deploy (Railway/Render) injects PORT — jangan hardcode
CMD ["npm", "start"]

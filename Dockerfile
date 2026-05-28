# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Install Hono and backend dependencies
RUN npm install hono @hono/zod-validator zod

# Copy built React app
COPY --from=builder /app/dist ./dist

# Copy backend source
COPY src/backend ./src/backend

# Copy tsconfig
COPY tsconfig.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/backend/index.ts"]

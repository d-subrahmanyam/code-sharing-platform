# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/public ./public

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

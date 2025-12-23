# Multi-stage Dockerfile for Premeepro (Vite + React)

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install optional build tools (git for some packages)
RUN apk add --no-cache git

# Copy package manifests (no lockfile is required but supported)
COPY package.json package-lock.json* ./

# Install dependencies including devDependencies for the build
RUN npm ci --include=dev

# Copy sources and build the app
COPY . .
RUN npm run build

# --- Production stage ---
FROM nginx:stable-alpine AS production

# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (will be added to repo)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the app
EXPOSE 80

# Basic healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]


# ── Stage 1: build ───────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: serve ───────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD ["wget", "-qO-", "http://127.0.0.1/index.html"]

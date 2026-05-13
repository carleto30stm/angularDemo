# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# URL del backend Spring Boot (Railway la inyecta como build arg)
ARG BACKEND_URL=http://localhost:8080

# Instalar yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copiar manifests primero para aprovechar cache de capas
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Copiar fuentes
COPY . .

# Inyectar la URL del backend en environment.prod.ts antes de compilar
RUN sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" src/environments/environment.prod.ts

RUN yarn build

# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Solo las dependencias de producción (Express + SSR)
COPY package.json yarn.lock ./
RUN corepack enable && corepack prepare yarn@1.22.22 --activate \
    && yarn install --frozen-lockfile --production \
    && yarn cache clean

# Copiar el output del build
COPY --from=builder /app/dist ./dist

# Railway inyecta PORT dinámicamente
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/ || exit 1

CMD ["node", "dist/productos/server/server.mjs"]

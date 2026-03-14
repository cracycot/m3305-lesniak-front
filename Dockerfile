# ========== Этап 1: установка зависимостей ==========
FROM node:22-alpine AS deps
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# ========== Этап 2: сборка приложения ==========
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./

RUN npm run build

# ========== Этап 3: готовое приложение ==========
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3080

# Пользователь без root
RUN addgroup -g 1001 -S nodejs && adduser -S nest -u 1001 -G nodejs

# Только то, что нужно в рантайме
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json /app/package-lock.json* ./

# Только production-зависимости (без devDependencies)
RUN npm ci --omit=dev

USER nest

EXPOSE 3080

# DATABASE_URL задаётся при запуске контейнера
CMD ["node", "dist/main.js"]

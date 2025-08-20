# ---------- STAGE 1: Build ----------
FROM node:22.17.0-alpine AS builder
WORKDIR /app

# 1) Сначала lock + prisma схема, чтобы postinstall знал, что генерить
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Теперь код
COPY . .

# 3) На всякий случай явно сгенерим клиент (полезно, если postinstall отключён)
RUN npx prisma generate

# 4) Сборка Nest
RUN npm run build

# ---------- STAGE 2: Run ----------
FROM node:22.17.0-alpine
WORKDIR /app
ENV NODE_ENV=production

# 1) Для рантайма нужны зависимости и prisma схема (для postinstall)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# 2) Кладём билд
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main"]

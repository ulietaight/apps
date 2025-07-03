# ---------- STAGE 1: Build ----------
FROM node:22.17.0-alpine AS builder

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY apps/frontend/package*.json ./
RUN npm install

# Копируем весь исходный код и билдим проект
COPY apps/frontend .
RUN npm run build

# ---------- STAGE 2: Serve ----------
FROM nginx:alpine

# Копируем билд из предыдущей стадии
COPY --from=builder /app/dist /usr/share/nginx/html

# Кастомный конфиг nginx (если есть)
# COPY infra/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Порт по умолчанию — 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

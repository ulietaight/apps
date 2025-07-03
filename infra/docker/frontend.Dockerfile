# ---------- STAGE 1: Build ----------
FROM node:22.17.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- STAGE 2: Serve ----------
FROM nginx:alpine

# Удаляем дефолтный конфиг (если хотим использовать свой позже)
RUN rm /etc/nginx/conf.d/default.conf

# Копируем билд
COPY --from=builder /app/dist /usr/share/nginx/html

# (Необязательно) Кастомный nginx.conf для SPA и proxy
COPY ./infra/nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
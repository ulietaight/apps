# 🚀 Fullstack-приложение на Node.js + React

Проект состоит из frontend (React + Vite) и backend (NestJS + PostgreSQL), развёртываемых в Docker-контейнерах с использованием GitHub Actions и GitHub Container Registry (GHCR).

---

## 📦 Состав проекта

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** NestJS + TypeORM + PostgreSQL
- **CI/CD:** GitHub Actions + SSH-деплой + GHCR
- **Прод-сборка:** `docker-compose.prod.yml`

---

## 📁 Структура проекта

```
apps/
├── backend/                  # NestJS backend
│   └── src/                  # Исходники
├── frontend/                 # Vite + React frontend
│   └── src/                  # Компоненты и страницы
├── infra/
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   └── frontend.Dockerfile
│   ├── nginx/
│   │   └── frontend.conf     # SPA + proxy
│   └── scripts/
│       └── deploy.sh         # Деплой на сервер
├── .github/
│   └── workflows/
│       └── docker-ci.yml     # GitHub Actions CI/CD
└── docker-compose.prod.yml   # Compose-файл для продакшена
```

---

## ⚙️ Установка локально

```bash
# Установка зависимостей
cd backend && npm install
cd ../frontend && npm install
```

Запуск в dev-режиме:

```bash
# Backend
cd backend && npm run start:dev

# Frontend (в другом окне терминала)
cd frontend && npm run dev
```

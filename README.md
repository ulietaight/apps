# Тестовое приложение: Переводы и транзакции

## 📦 Стек технологий

* **Backend:** NestJS (TypeScript)
* **ORM:** Prisma
* **База данных:** PostgreSQL
* **Кэш:** Redis
* **Контейнеризация:** Docker, Docker Compose

## 🚀 Запуск проекта

### Установка зависимостей

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Запуск Docker-инфраструктуры (Postgres + Redis)

```bash
docker compose -f infra/docker-compose.prod.yml up -d
```

### Применение миграций

```bash
cd backend
npx prisma migrate dev
```

### Запуск backend

```bash
npm run start:dev
```

### Запуск frontend

```bash
cd frontend
npm run dev
```

---

## 📁 Структура проекта

```
apps/
├── backend/            # Серверная логика на NestJS
├── frontend/           # Интерфейс на React + Vite
└── infra/              # Docker, Nginx, скрипты деплоя
```

---

## ⚙️ Переменные окружения `.env`

Создай файл `backend/.env` со следующим содержанием:

```env
# Общие
PORT=3000
NODE_ENV=development

# База данных (для Prisma)
DATABASE_URL=postgresql://postgres:secret@localhost:5432/transactions_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# ORM
ORM=PRISMA # В будущем возможно DRIZZLE

# Транзакционная стратегия
TRANSACTION_STRATEGY=PESSIMISTIC # Или: OPTIMISTIC, ATOMIC, ISOLATION, NO_TRANSACTION
ISOLATION_LEVEL=Serializable     # Для ISOLATION: Read Committed, Repeatable Read, Serializable
```

---

## 🔁 Доступные API-эндпоинты

| Метод | URL                    | Описание                             |
| ----- | ---------------------- | ------------------------------------ |
| GET   | `/user/:id/balance`    | Баланс пользователя (кэш + fallback) |
| POST  | `/transaction`         | Перевод средств между пользователями |
| GET   | `/transaction/history` | История транзакций пользователя      |
| GET   | `/admin/transactions`  | Все транзакции (админ)               |
| GET   | `/admin/strategy`      | Текущая стратегия транзакций         |

---

## ✅ Поддерживаемые стратегии транзакций

* **PESSIMISTIC** — SELECT ... FOR UPDATE
* **OPTIMISTIC** — по полю `version`
* **ATOMIC** — без транзакций, через `decrement` / `increment`
* **ISOLATION** — уровни изоляции, задаются через `ISOLATION_LEVEL`
* **NO\_TRANSACTION** — без транзакционной обёртки, небезопасно

---

## 🧪 Тесты

* Jest (backend) — юнит- и интеграционные тесты
* Возможна настройка Postman + Newman для API

---

## 🐳 Docker (для продакшена)

```bash
docker compose -f infra/docker-compose.prod.yml up --build -d
```

---

## 📌 Примечание

Для запуска Prisma CLI и миграций необходима переменная `DATABASE_URL` в `.env`.

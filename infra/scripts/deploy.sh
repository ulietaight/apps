#!/usr/bin/env bash
set -euo pipefail

# === настройки ===
REPO_DIR="/root/apps"                         # путь к репо на сервере
COMPOSE_FILE="infra/docker-compose.prod.yml"  # compose-файл
PROJECT="apps"                                # фиксированное имя проекта

# === autodetect compose v1/v2 ===
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  echo "❌ Docker Compose не найден (ни v1, ни v2)."
  exit 1
fi

cd "$REPO_DIR"

# === логин в GHCR и пул образов ===
: "${GHCR_USERNAME:?GHCR_USERNAME not set}"
: "${GHCR_TOKEN:?GHCR_TOKEN not set}"

echo "🔐 Логинимся в GHCR..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "📥 Тянем свежие образы..."
docker pull "ghcr.io/${GHCR_USERNAME}/apps-backend:latest"
docker pull "ghcr.io/${GHCR_USERNAME}/apps-frontend:latest"

# === аккуратно опускаем текущий стек (без удаления томов) ===
echo "🧹 Останавливаем/чистим старый стек..."
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" down --remove-orphans || true

# === поднимаем прод из свежих образов ===
echo "🚀 Запускаем прод..."
# --pull always заставляет compose самому подтянуть образы при необходимости
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" up -d --pull always --no-build

# === опциональная чистка dangling-образов после удачного деплоя ===
echo "🧼 Чистим неиспользуемые образы (dangling)..."
docker image prune -f

echo "✅ Готово. Статус:"
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" ps

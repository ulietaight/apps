#!/usr/bin/env bash
set -euo pipefail

# === настройки ===
REPO_DIR="/root/apps"                         # путь к репо на сервере
COMPOSE_FILE="infra/docker-compose.prod.yml"  # compose-файл (попробуем и альтернативу)
PROJECT="apps"                                # фиксированное имя проекта
ENV_FILE="$REPO_DIR/.env"                     # где хранить переменные для compose

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

# === найти compose-файл, если указанного пути нет ===
if [ ! -f "$COMPOSE_FILE" ]; then
  if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
  elif [ -f "docker-compose.yaml" ]; then
    COMPOSE_FILE="docker-compose.yaml"
  elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
  else
    echo "❌ Не нашёл compose-файл (искал $COMPOSE_FILE, docker-compose.prod.yml, docker-compose.yaml, docker-compose.yml)."
    exit 1
  fi
fi

# === секреты из окружения (передаются из GitHub Actions) ===
: "${GHCR_USERNAME:?GHCR_USERNAME not set}"
: "${GHCR_TOKEN:?GHCR_TOKEN not set}"
: "${RIOT_API_KEY:?RIOT_API_KEY not set}"   # ← обязателен

# === пишем .env для compose (только нужные переменные) ===
umask 077
{
  printf "RIOT_API_KEY=%s\n" "${RIOT_API_KEY}"
  # при необходимости добавь и другие:
  # printf "RIOT_REGIONAL=%s\n" "${RIOT_REGIONAL:-europe}"
} > "$ENV_FILE"

echo "🔐 Логинимся в GHCR..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "📥 Тянем свежие образы..."
docker pull "ghcr.io/${GHCR_USERNAME}/apps-backend:latest"
docker pull "ghcr.io/${GHCR_USERNAME}/apps-frontend:latest"

echo "🧹 Останавливаем/чистим старый стек..."
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" down --remove-orphans || true

echo "🚀 Запускаем прод..."
$COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" up -d --pull always --no-build

# быстрая проверка, что ключ попал внутрь контейнера (не печатает сам ключ)
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" exec -T backend sh -lc 'test -n "$RIOT_API_KEY" && echo "RIOT_API_KEY=OK" || (echo "RIOT_API_KEY=MISSING"; exit 1)'

echo "🧼 Чистим неиспользуемые образы (dangling)..."
docker image prune -f

echo "✅ Готово. Статус:"
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" ps

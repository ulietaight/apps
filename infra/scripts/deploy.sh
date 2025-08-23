#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/root/apps"
COMPOSE_FILE="infra/docker-compose.prod.yml"
PROJECT="apps"
ENV_FILE="$REPO_DIR/.env"

# autodetect compose
if command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose";
elif docker compose version >/dev/null 2>&1; then COMPOSE="docker compose";
else echo "❌ Docker Compose не найден"; exit 1; fi

cd "$REPO_DIR"

# если путь другой – подхватим альтернативные имена
if [ ! -f "$COMPOSE_FILE" ]; then
  for f in docker-compose.prod.yml docker-compose.yaml docker-compose.yml; do
    [ -f "$f" ] && COMPOSE_FILE="$f" && break
  done
  [ -f "$COMPOSE_FILE" ] || { echo "❌ Не нашёл compose-файл"; exit 1; }
fi

# --- обязательный секрет Riot ---
: "${RIOT_API_KEY:?RIOT_API_KEY not set}"

# пишем .env для compose
umask 077
printf "RIOT_API_KEY=%s\n" "${RIOT_API_KEY}" > "$ENV_FILE"

# --- GHCR login (опционально) ---
if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "🔐 Логинимся в GHCR..."
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
  echo "📥 Тянем свежие образы..."
  docker pull "ghcr.io/${GHCR_USERNAME}/apps-backend:latest" || true
  docker pull "ghcr.io/${GHCR_USERNAME}/apps-frontend:latest" || true
else
  echo "ℹ️ Пропускаю GHCR login/pull (нет GHCR_USERNAME/GHCR_TOKEN)"
fi

echo "🧹 Останавливаем старый стек..."
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" down --remove-orphans || true

echo "🚀 Запускаем прод..."
$COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT" up -d --pull always --no-build

# проверим, что RIOT_API_KEY внутри контейнера есть
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" exec -T backend sh -lc 'test -n "$RIOT_API_KEY" && echo "RIOT_API_KEY=OK" || (echo "RIOT_API_KEY=MISSING"; exit 1)'

echo "🧼 Чистим dangling-образы..."
docker image prune -f

echo "✅ Готово:"
$COMPOSE -f "$COMPOSE_FILE" -p "$PROJECT" ps

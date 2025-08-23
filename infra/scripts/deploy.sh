#!/usr/bin/env bash
set -euo pipefail

# === настройки ===
REPO_DIR="/root/apps"                  # путь к репо на сервере
PROJECT="apps"                         # имя проекта docker compose
ENV_FILE="$REPO_DIR/.env"              # где хранить переменные для compose

# === autodetect compose v1/v2 ===
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  echo "❌ Docker Compose не найден (ни v1, ни v2)."; exit 1
fi

cd "$REPO_DIR"
echo "🔎 CWD: $(pwd)"
echo "🔎 Files here:"; ls -la

# === выбрать compose-файл из возможных вариантов ===
CF=""
for cand in \
  docker-compose.prod.yml \
  docker-compose.prod.yaml \
  docker-compose.yml \
  docker-compose.yaml \
  infra/docker-compose.prod.yml \
  infra/docker-compose.prod.yaml \
  infra/docker/docker-compose.prod.yml \
  infra/docker/docker-compose.prod.yaml
do
  if [ -f "$cand" ]; then CF="$cand"; break; fi
done

if [ -z "$CF" ]; then
  echo "❌ Не нашёл compose-файл."
  echo "Поиск похожих файлов:"; find . -maxdepth 3 -type f -iname 'docker-compose*.y*' || true
  exit 1
fi
echo "📄 Использую compose-файл: $CF"

# === секреты из окружения (приходят из GitHub Actions) ===
: "${RIOT_API_KEY:?RIOT_API_KEY not set}"   # обязателен

# GHCR (опционально — если образы приватные)
GHCR_USERNAME="${GHCR_USERNAME:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

# === пишем .env для compose (минимум RIOT_API_KEY) ===
umask 077
{
  printf "RIOT_API_KEY=%s\n" "${RIOT_API_KEY}"
  # при необходимости можно добавить:
  # printf "RIOT_REGIONAL=%s\n" "${RIOT_REGIONAL:-europe}"
} > "$ENV_FILE"
echo "📝 Обновил $ENV_FILE"

# === GHCR login + pull (если заданы креды) ===
if [ -n "$GHCR_USERNAME" ] && [ -n "$GHCR_TOKEN" ]; then
  echo "🔐 Логинимся в GHCR..."
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
  echo "📥 Тянем свежие образы..."
  docker pull "ghcr.io/${GHCR_USERNAME}/apps-backend:latest" || true
  docker pull "ghcr.io/${GHCR_USERNAME}/apps-frontend:latest" || true
else
  echo "ℹ️ Пропускаю GHCR login/pull (нет GHCR_USERNAME/GHCR_TOKEN)"
fi

# === down / up ===
echo "🧹 Останавливаем старый стек..."
$COMPOSE -f "$CF" -p "$PROJECT" down --remove-orphans || true

echo "🚀 Запускаем прод..."
$COMPOSE -f "$CF" --env-file "$ENV_FILE" -p "$PROJECT" up -d --pull always --no-build

# === проверка, что ключ попал в контейнер ===
$COMPOSE -f "$CF" -p "$PROJECT" exec -T backend sh -lc 'test -n "$RIOT_API_KEY" && echo "RIOT_API_KEY=OK" || (echo "RIOT_API_KEY=MISSING"; exit 1)'

echo "🧼 Чистим dangling-образы..."
docker image prune -f || true

echo "✅ Статус контейнеров:"
$COMPOSE -f "$CF" -p "$PROJECT" ps

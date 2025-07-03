#!/bin/bash

set -e

echo "🔐 Логинимся в GHCR..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

echo "📥 Тянем свежие образы..."
docker pull ghcr.io/${GHCR_USERNAME}/apps-backend:latest
docker pull ghcr.io/${GHCR_USERNAME}/apps-frontend:latest

echo "🧹 Чистим старые контейнеры..."
docker stop apps-backend || true && docker rm apps-backend || true
docker stop apps-frontend || true && docker rm apps-frontend || true

echo "🚀 Запускаем прод..."
docker-compose -f infra/docker-compose.prod.yml up -d

echo "🧼 Чистим неиспользуемые образы..."
docker image prune -f
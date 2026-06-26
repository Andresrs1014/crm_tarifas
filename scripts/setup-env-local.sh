#!/bin/sh
# Copia plantilla de entorno local Docker → .env
set -e
cd "$(dirname "$0")/.."
if [ ! -f .env.docker.local ]; then
  echo "ERROR: falta .env.docker.local"
  exit 1
fi
cp .env.docker.local .env
echo "OK: .env creado desde .env.docker.local"
echo "Siguiente: docker compose up --build -d"

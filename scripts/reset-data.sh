#!/bin/sh
# Borra TODOS los datos de negocio de crm_tarifas (registros, cotizaciones, biblioteca,
# matriz de riesgos, fichas, etc.) y conserva la tabla "users" (login) intacta.
# Uso: scripts/reset-data.sh [--yes]
set -e
cd "$(dirname "$0")/.."

if [ "$1" != "--yes" ]; then
  echo "Esto va a BORRAR TODOS los datos de negocio de crm_tarifas (no se puede deshacer)."
  echo "La tabla de USUARIOS (login) se conserva intacta."
  printf 'Escribe ELIMINAR TODO para confirmar: '
  read -r CONFIRM
  if [ "$CONFIRM" != "ELIMINAR TODO" ]; then
    echo "Cancelado, no se hizo ningún cambio."
    exit 1
  fi
fi

docker compose exec -T crm-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < scripts/reset-data.sql

echo "OK: datos eliminados. Los usuarios (login) se conservaron."

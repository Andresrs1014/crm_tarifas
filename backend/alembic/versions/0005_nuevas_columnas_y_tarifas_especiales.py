"""0005: nuevas columnas SAC/cotizaciones y tabla tarifas_especiales

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-04

Agrega:
  - records.direccion, records.categoria
  - contactos.cumpleanos, contactos.recibe_regalos, contactos.fotos_entrega,
    contactos.fotos_fda, contactos.fda_entregado, contactos.direccion
  - cotizaciones.paqueteadora, cotizaciones.tarifa_tipo, cotizaciones.tarifa_especial_id
  - tabla tarifas_especiales
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_columns(conn, table: str) -> set:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _table_exists(conn, table: str) -> bool:
    result = conn.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"),
        {"t": table},
    ).fetchone()
    return result is not None


def _add_column_if_missing(conn, table: str, column: str, col_def: str) -> None:
    if column not in _existing_columns(conn, table):
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"))
        print(f"[0005] {table}.{column} añadida.")


def upgrade() -> None:
    conn = op.get_bind()

    # --- records ---
    _add_column_if_missing(conn, "records", "direccion", "TEXT")
    _add_column_if_missing(conn, "records", "categoria", "TEXT")

    # --- contactos ---
    _add_column_if_missing(conn, "contactos", "cumpleanos", "DATE")
    _add_column_if_missing(conn, "contactos", "recibe_regalos", "TEXT")
    _add_column_if_missing(conn, "contactos", "fotos_entrega", "TEXT")
    _add_column_if_missing(conn, "contactos", "fotos_fda", "TEXT")
    _add_column_if_missing(conn, "contactos", "fda_entregado", "INTEGER")
    _add_column_if_missing(conn, "contactos", "direccion", "TEXT")

    # --- cotizaciones ---
    _add_column_if_missing(conn, "cotizaciones", "paqueteadora", "TEXT")
    _add_column_if_missing(conn, "cotizaciones", "tarifa_tipo", "TEXT")
    _add_column_if_missing(conn, "cotizaciones", "tarifa_especial_id", "TEXT")

    # --- nueva tabla tarifas_especiales ---
    if not _table_exists(conn, "tarifas_especiales"):
        op.create_table(
            "tarifas_especiales",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column("nombre", sa.String(), nullable=False),
            sa.Column("servicio", sa.String(), nullable=False),
            sa.Column("grupos", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_tarifas_especiales_id", "tarifas_especiales", ["id"])
        op.create_index("ix_tarifas_especiales_servicio", "tarifas_especiales", ["servicio"])
        print("[0005] tabla tarifas_especiales creada.")


def downgrade() -> None:
    conn = op.get_bind()

    if _table_exists(conn, "tarifas_especiales"):
        op.drop_index("ix_tarifas_especiales_servicio", table_name="tarifas_especiales")
        op.drop_index("ix_tarifas_especiales_id", table_name="tarifas_especiales")
        op.drop_table("tarifas_especiales")

    # SQLite no soporta DROP COLUMN en versiones antiguas — se omite el downgrade de columnas
    # Para un rollback completo de columnas en SQLite se requiere recrear la tabla

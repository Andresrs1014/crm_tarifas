"""0006: agrega fecha_visita y fecha_visita_cliente a records

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-07

Agrega:
  - records.fecha_visita       (DATE, prospecto)
  - records.fecha_visita_cliente (DATE, cliente)
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_columns(conn, table: str) -> set:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _add_column_if_missing(conn, table: str, column: str, col_def: str) -> None:
    if column not in _existing_columns(conn, table):
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"))
        print(f"[0006] {table}.{column} añadida.")


def upgrade() -> None:
    conn = op.get_bind()
    _add_column_if_missing(conn, "records", "fecha_visita", "DATE")
    _add_column_if_missing(conn, "records", "fecha_visita_cliente", "DATE")


def downgrade() -> None:
    pass  # SQLite no soporta DROP COLUMN fácilmente

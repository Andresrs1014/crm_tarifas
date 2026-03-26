"""fase4 cotizaciones: cotizaciones + cot_numero_counter

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cot_numero_counter",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("counter", sa.Integer(), nullable=False, server_default="0"),
    )
    # Insertar el singleton id=1
    op.execute("INSERT INTO cot_numero_counter (id, counter) VALUES (1, 0)")

    op.create_table(
        "cotizaciones",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("numero", sa.String(), nullable=False),
        sa.Column("empresa", sa.String(), nullable=False),
        sa.Column("nit", sa.String(), nullable=True),
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id"),
            nullable=True,
        ),
        sa.Column("contacto", sa.String(), nullable=True),
        sa.Column("cargo", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("telefono", sa.String(), nullable=True),
        sa.Column(
            "comercial_id",
            sa.String(36),
            sa.ForeignKey("comerciales.id"),
            nullable=True,
        ),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("vigencia", sa.Date(), nullable=False),
        sa.Column("estado", sa.String(), nullable=False, server_default="borrador"),
        sa.Column("asunto", sa.Text(), nullable=True),
        sa.Column("lineas", sa.Text(), nullable=False),
        sa.Column("items_snapshot", sa.Text(), nullable=False),
        sa.Column("obs_plantillas", sa.Text(), nullable=True, server_default="{}"),
        sa.Column("obs_libre", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_cotizaciones_id", "cotizaciones", ["id"])
    op.create_index("ix_cotizaciones_numero", "cotizaciones", ["numero"], unique=True)
    op.create_index("ix_cotizaciones_estado", "cotizaciones", ["estado"])
    op.create_index("ix_cotizaciones_comercial_id", "cotizaciones", ["comercial_id"])


def downgrade() -> None:
    op.drop_index("ix_cotizaciones_comercial_id", table_name="cotizaciones")
    op.drop_index("ix_cotizaciones_estado", table_name="cotizaciones")
    op.drop_index("ix_cotizaciones_numero", table_name="cotizaciones")
    op.drop_index("ix_cotizaciones_id", table_name="cotizaciones")
    op.drop_table("cotizaciones")
    op.drop_table("cot_numero_counter")

"""fase3 biblioteca: lineas, grupos, items, observaciones

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "biblioteca_lineas",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("columnas", sa.Text(), nullable=True, server_default="[]"),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_biblioteca_lineas_id", "biblioteca_lineas", ["id"])
    op.create_index("ix_biblioteca_lineas_nombre", "biblioteca_lineas", ["nombre"], unique=True)

    op.create_table(
        "biblioteca_grupos",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "linea_id",
            sa.String(36),
            sa.ForeignKey("biblioteca_lineas.id"),
            nullable=False,
        ),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_biblioteca_grupos_id", "biblioteca_grupos", ["id"])
    op.create_index("ix_biblioteca_grupos_linea_id", "biblioteca_grupos", ["linea_id"])

    op.create_table(
        "biblioteca_items",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "grupo_id",
            sa.String(36),
            sa.ForeignKey("biblioteca_grupos.id"),
            nullable=False,
        ),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("tarifa", sa.String(), nullable=False),
        sa.Column("tipo_tarifa", sa.String(), nullable=False),
        sa.Column("obs", sa.Text(), nullable=True),
        sa.Column("extra_cols", sa.Text(), nullable=True, server_default="{}"),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_biblioteca_items_id", "biblioteca_items", ["id"])
    op.create_index("ix_biblioteca_items_grupo_id", "biblioteca_items", ["grupo_id"])

    op.create_table(
        "biblioteca_observaciones",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "linea_id",
            sa.String(36),
            sa.ForeignKey("biblioteca_lineas.id"),
            nullable=False,
        ),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("html", sa.Text(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_biblioteca_observaciones_id", "biblioteca_observaciones", ["id"])
    op.create_index("ix_biblioteca_observaciones_linea_id", "biblioteca_observaciones", ["linea_id"])


def downgrade() -> None:
    op.drop_index("ix_biblioteca_observaciones_linea_id", table_name="biblioteca_observaciones")
    op.drop_index("ix_biblioteca_observaciones_id", table_name="biblioteca_observaciones")
    op.drop_table("biblioteca_observaciones")

    op.drop_index("ix_biblioteca_items_grupo_id", table_name="biblioteca_items")
    op.drop_index("ix_biblioteca_items_id", table_name="biblioteca_items")
    op.drop_table("biblioteca_items")

    op.drop_index("ix_biblioteca_grupos_linea_id", table_name="biblioteca_grupos")
    op.drop_index("ix_biblioteca_grupos_id", table_name="biblioteca_grupos")
    op.drop_table("biblioteca_grupos")

    op.drop_index("ix_biblioteca_lineas_nombre", table_name="biblioteca_lineas")
    op.drop_index("ix_biblioteca_lineas_id", table_name="biblioteca_lineas")
    op.drop_table("biblioteca_lineas")

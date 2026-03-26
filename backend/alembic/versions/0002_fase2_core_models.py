"""fase2 core models: comerciales, records, contactos, actividades

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comerciales",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("cargo", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("tel", sa.String(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_comerciales_id", "comerciales", ["id"])
    op.create_index("ix_comerciales_email", "comerciales", ["email"], unique=True)

    op.create_table(
        "records",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("empresa", sa.String(), nullable=False),
        sa.Column("nit", sa.String(), nullable=True),
        sa.Column("ciudad", sa.String(), nullable=True),
        sa.Column(
            "comercial_id",
            sa.String(36),
            sa.ForeignKey("comerciales.id"),
            nullable=True,
        ),
        sa.Column("tipo_cliente", sa.String(), nullable=False, server_default="directo"),
        sa.Column(
            "cliente_indirecto_id",
            sa.String(36),
            sa.ForeignKey("records.id"),
            nullable=True,
        ),
        sa.Column("comision", sa.String(), nullable=True),
        sa.Column("servicios", sa.Text(), nullable=True, server_default="[]"),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("proximo_seguimiento", sa.Date(), nullable=True),
        # Prospecto-specific
        sa.Column("estado_prospecto", sa.String(), nullable=True),
        sa.Column("visita", sa.String(), nullable=True),
        sa.Column("facturado_p", sa.String(), nullable=True),
        sa.Column("valor_p", sa.Integer(), nullable=True),
        # Cliente-specific
        sa.Column("estado_cliente", sa.String(), nullable=True),
        sa.Column("visita_cliente", sa.String(), nullable=True),
        sa.Column("nuevo_servicio", sa.String(), nullable=True),
        sa.Column("servicio_nuevo", sa.String(), nullable=True),
        sa.Column("facturado", sa.String(), nullable=True),
        sa.Column("valor", sa.Integer(), nullable=True),
        sa.Column("facturacion_lineas", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_records_id", "records", ["id"])
    op.create_index("ix_records_tipo", "records", ["tipo"])
    op.create_index("ix_records_empresa", "records", ["empresa"])
    op.create_index("ix_records_comercial_id", "records", ["comercial_id"])

    op.create_table(
        "contactos",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id"),
            nullable=False,
        ),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("cargo", sa.String(), nullable=True),
        sa.Column("telefono", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_contactos_id", "contactos", ["id"])
    op.create_index("ix_contactos_record_id", "contactos", ["record_id"])

    op.create_table(
        "actividades",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id"),
            nullable=False,
        ),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_actividades_id", "actividades", ["id"])
    op.create_index("ix_actividades_record_id", "actividades", ["record_id"])


def downgrade() -> None:
    op.drop_index("ix_actividades_record_id", table_name="actividades")
    op.drop_index("ix_actividades_id", table_name="actividades")
    op.drop_table("actividades")

    op.drop_index("ix_contactos_record_id", table_name="contactos")
    op.drop_index("ix_contactos_id", table_name="contactos")
    op.drop_table("contactos")

    op.drop_index("ix_records_comercial_id", table_name="records")
    op.drop_index("ix_records_empresa", table_name="records")
    op.drop_index("ix_records_tipo", table_name="records")
    op.drop_index("ix_records_id", table_name="records")
    op.drop_table("records")

    op.drop_index("ix_comerciales_email", table_name="comerciales")
    op.drop_index("ix_comerciales_id", table_name="comerciales")
    op.drop_table("comerciales")

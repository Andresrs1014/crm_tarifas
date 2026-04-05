import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TarifaEspecial(SQLModel, table=True):
    __tablename__ = "tarifas_especiales"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    nombre: str = Field(nullable=False, index=True)   # nombre descriptivo, ej. "Cliente XYZ 2025"
    servicio: str = Field(nullable=False, index=True)  # Zona Franca|Depósito Aduanero|etc.
    grupos: str = Field(nullable=False)               # JSON — misma estructura que items_snapshot por línea
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

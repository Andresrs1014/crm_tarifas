import uuid
from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class Contacto(SQLModel, table=True):
    __tablename__ = "contactos"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    record_id: uuid.UUID = Field(
        foreign_key="records.id", index=True, nullable=False
    )
    nombre: str = Field(nullable=False)
    cargo: Optional[str] = Field(default=None)
    telefono: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    orden: int = Field(default=0, nullable=False)  # 0 = contacto principal

    # SAC fields
    cumpleanos: Optional[date] = Field(default=None)
    recibe_regalos: Optional[str] = Field(default=None)      # si|no|tal_vez
    fotos_entrega: Optional[str] = Field(default=None)       # JSON list[str]
    fotos_fda: Optional[str] = Field(default=None)           # JSON list[str]
    fda_entregado: Optional[bool] = Field(default=None)
    direccion: Optional[str] = Field(default=None)

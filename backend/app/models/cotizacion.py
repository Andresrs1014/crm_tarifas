import uuid
from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Cotizacion(SQLModel, table=True):
    __tablename__ = "cotizaciones"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    numero: str = Field(unique=True, nullable=False, index=True)  # COT-001, COT-002...
    empresa: str = Field(nullable=False)
    nit: Optional[str] = Field(default=None)
    record_id: Optional[uuid.UUID] = Field(default=None, foreign_key="records.id")
    contacto: Optional[str] = Field(default=None)
    cargo: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    telefono: Optional[str] = Field(default=None)
    comercial_id: Optional[uuid.UUID] = Field(default=None, foreign_key="comerciales.id")
    fecha: date = Field(nullable=False)
    vigencia: date = Field(nullable=False)
    estado: str = Field(default="borrador", nullable=False)  # borrador|enviada|negociacion|aprobada|rechazada
    asunto: Optional[str] = Field(default=None)
    lineas: str = Field(nullable=False)              # JSON list[str]
    items_snapshot: str = Field(nullable=False)      # JSON deep clone — NUNCA referencias a biblioteca
    obs_plantillas: Optional[str] = Field(default="{}")  # JSON dict[str, list[str]]
    obs_libre: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class CotNumeroCounter(SQLModel, table=True):
    """Singleton para numeración atómica. Siempre existe solo la fila id=1."""
    __tablename__ = "cot_numero_counter"

    id: int = Field(default=1, primary_key=True)
    counter: int = Field(default=0, nullable=False)

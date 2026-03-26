import uuid
from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Record(SQLModel, table=True):
    __tablename__ = "records"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    tipo: str = Field(nullable=False, index=True)        # prospecto | cliente
    empresa: str = Field(nullable=False, index=True)
    nit: Optional[str] = Field(default=None)
    ciudad: Optional[str] = Field(default=None)

    comercial_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="comerciales.id", index=True
    )
    tipo_cliente: str = Field(default="directo", nullable=False)  # directo|indirecto|referido
    cliente_indirecto_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="records.id"
    )
    comision: Optional[str] = Field(default=None)

    servicios: Optional[str] = Field(default="[]")       # JSON list[str]
    observaciones: Optional[str] = Field(default=None)
    fecha: date = Field(default_factory=date.today, nullable=False)
    proximo_seguimiento: Optional[date] = Field(default=None)

    # Prospecto-specific
    estado_prospecto: Optional[str] = Field(default=None)  # seguimiento|cerrado|perdido|frio
    visita: Optional[str] = Field(default=None)             # no|si|virtual|llamada
    facturado_p: Optional[str] = Field(default=None)        # no|si|parcial
    valor_p: Optional[int] = Field(default=None)            # COP

    # Cliente-specific
    estado_cliente: Optional[str] = Field(default=None)    # activo|en-riesgo|inactivo
    visita_cliente: Optional[str] = Field(default=None)    # no|si|virtual|llamada
    nuevo_servicio: Optional[str] = Field(default=None)    # si|no
    servicio_nuevo: Optional[str] = Field(default=None)
    facturado: Optional[str] = Field(default=None)         # no|si|parcial
    valor: Optional[int] = Field(default=None)             # COP
    facturacion_lineas: Optional[str] = Field(default=None)  # JSON dict[str, int]

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

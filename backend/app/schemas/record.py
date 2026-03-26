import json
import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.contacto import ContactoCreate, ContactoRead
from app.schemas.actividad import ActividadRead


class RecordCreate(BaseModel):
    tipo: str  # prospecto | cliente
    empresa: str
    nit: Optional[str] = None
    ciudad: Optional[str] = None
    comercial_id: Optional[uuid.UUID] = None
    tipo_cliente: str = "directo"  # directo|indirecto|referido
    cliente_indirecto_id: Optional[uuid.UUID] = None
    comision: Optional[str] = None
    servicios: list[str] = []
    observaciones: Optional[str] = None
    fecha: date = Field(default_factory=date.today)
    proximo_seguimiento: Optional[date] = None

    # Prospecto
    estado_prospecto: Optional[str] = None  # seguimiento|cerrado|perdido|frio
    visita: Optional[str] = None            # no|si|virtual|llamada
    facturado_p: Optional[str] = None       # no|si|parcial
    valor_p: Optional[int] = None           # COP

    # Cliente
    estado_cliente: Optional[str] = None   # activo|en-riesgo|inactivo
    visita_cliente: Optional[str] = None   # no|si|virtual|llamada
    nuevo_servicio: Optional[str] = None   # si|no
    servicio_nuevo: Optional[str] = None
    facturado: Optional[str] = None        # no|si|parcial
    valor: Optional[int] = None            # COP
    facturacion_lineas: dict[str, int] = {}

    # Contactos opcionales al crear el record
    contactos: list[ContactoCreate] = []


class RecordUpdate(BaseModel):
    empresa: Optional[str] = None
    nit: Optional[str] = None
    ciudad: Optional[str] = None
    comercial_id: Optional[uuid.UUID] = None
    tipo_cliente: Optional[str] = None
    cliente_indirecto_id: Optional[uuid.UUID] = None
    comision: Optional[str] = None
    servicios: Optional[list[str]] = None
    observaciones: Optional[str] = None
    fecha: Optional[date] = None
    proximo_seguimiento: Optional[date] = None

    estado_prospecto: Optional[str] = None
    visita: Optional[str] = None
    facturado_p: Optional[str] = None
    valor_p: Optional[int] = None

    estado_cliente: Optional[str] = None
    visita_cliente: Optional[str] = None
    nuevo_servicio: Optional[str] = None
    servicio_nuevo: Optional[str] = None
    facturado: Optional[str] = None
    valor: Optional[int] = None
    facturacion_lineas: Optional[dict[str, int]] = None


class RecordRead(BaseModel):
    id: uuid.UUID
    tipo: str
    empresa: str
    nit: Optional[str]
    ciudad: Optional[str]
    comercial_id: Optional[uuid.UUID]
    tipo_cliente: str
    cliente_indirecto_id: Optional[uuid.UUID]
    comision: Optional[str]
    servicios: list[str]
    observaciones: Optional[str]
    fecha: date
    proximo_seguimiento: Optional[date]
    estado_prospecto: Optional[str]
    visita: Optional[str]
    facturado_p: Optional[str]
    valor_p: Optional[int]
    estado_cliente: Optional[str]
    visita_cliente: Optional[str]
    nuevo_servicio: Optional[str]
    servicio_nuevo: Optional[str]
    facturado: Optional[str]
    valor: Optional[int]
    facturacion_lineas: dict[str, int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("servicios", mode="before")
    @classmethod
    def parse_servicios(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v or []

    @field_validator("facturacion_lineas", mode="before")
    @classmethod
    def parse_facturacion_lineas(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else {}
        if v is None:
            return {}
        return v


class RecordReadDetalle(RecordRead):
    contactos: list[ContactoRead] = []
    actividades: list[ActividadRead] = []

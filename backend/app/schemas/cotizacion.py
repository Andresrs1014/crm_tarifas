import json
import uuid
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class CotizacionCreate(BaseModel):
    empresa: str
    nit: Optional[str] = None
    record_id: Optional[uuid.UUID] = None
    contacto: Optional[str] = None
    cargo: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    comercial_id: Optional[uuid.UUID] = None
    fecha: date = Field(default_factory=date.today)
    vigencia: date
    asunto: Optional[str] = None
    lineas: list[str]
    items_snapshot: dict[str, Any]       # deep clone del wizard
    obs_plantillas: dict[str, list[str]] = {}
    obs_libre: Optional[str] = None
    paqueteadora: Optional[str] = None
    tarifa_tipo: Optional[dict[str, str]] = None     # {linea: "biblioteca"|"especial"}
    tarifa_especial_id: Optional[dict[str, str]] = None  # {linea: uuid_str}


class CotizacionUpdate(BaseModel):
    empresa: Optional[str] = None
    nit: Optional[str] = None
    record_id: Optional[uuid.UUID] = None
    contacto: Optional[str] = None
    cargo: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    comercial_id: Optional[uuid.UUID] = None
    fecha: Optional[date] = None
    vigencia: Optional[date] = None
    estado: Optional[str] = None
    asunto: Optional[str] = None
    lineas: Optional[list[str]] = None
    items_snapshot: Optional[dict[str, Any]] = None
    obs_plantillas: Optional[dict[str, list[str]]] = None
    obs_libre: Optional[str] = None
    paqueteadora: Optional[str] = None
    tarifa_tipo: Optional[dict[str, str]] = None
    tarifa_especial_id: Optional[dict[str, str]] = None


class CotizacionRead(BaseModel):
    id: uuid.UUID
    numero: str
    empresa: str
    nit: Optional[str]
    record_id: Optional[uuid.UUID]
    contacto: Optional[str]
    cargo: Optional[str]
    email: Optional[str]
    telefono: Optional[str]
    comercial_id: Optional[uuid.UUID]
    fecha: date
    vigencia: date
    estado: str
    asunto: Optional[str]
    lineas: list[str]
    items_snapshot: dict[str, Any]
    obs_plantillas: dict[str, list[str]]
    obs_libre: Optional[str]
    paqueteadora: Optional[str]
    tarifa_tipo: Optional[dict[str, str]]
    tarifa_especial_id: Optional[dict[str, str]]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("lineas", mode="before")
    @classmethod
    def parse_lineas(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v or []

    @field_validator("items_snapshot", mode="before")
    @classmethod
    def parse_items_snapshot(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else {}
        return v or {}

    @field_validator("obs_plantillas", mode="before")
    @classmethod
    def parse_obs_plantillas(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else {}
        if v is None:
            return {}
        return v

    @field_validator("tarifa_tipo", mode="before")
    @classmethod
    def parse_tarifa_tipo(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else None
        return v

    @field_validator("tarifa_especial_id", mode="before")
    @classmethod
    def parse_tarifa_especial_id(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else None
        return v


class ActualizarTarifasBody(BaseModel):
    porcentaje: float
    items_keys: list[str]  # nombres de items a incrementar (solo tipo_tarifa='moneda')


class TarifaEspecialCreate(BaseModel):
    nombre: str
    servicio: str
    grupos: list[Any]  # misma estructura que items_snapshot por línea


class TarifaEspecialUpdate(BaseModel):
    nombre: Optional[str] = None
    servicio: Optional[str] = None
    grupos: Optional[list[Any]] = None


class TarifaEspecialRead(BaseModel):
    id: uuid.UUID
    nombre: str
    servicio: str
    grupos: list[Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("grupos", mode="before")
    @classmethod
    def parse_grupos(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v or []

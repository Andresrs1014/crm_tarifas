import json
import uuid
from typing import Any, Optional

from pydantic import BaseModel, field_validator


# ---------- Items ----------

class ItemCreate(BaseModel):
    grupo_id: uuid.UUID
    nombre: str
    tarifa: str
    tipo_tarifa: str  # moneda | porcentaje
    obs: Optional[str] = None
    extra_cols: dict[str, Any] = {}
    orden: int = 0


class ItemUpdate(BaseModel):
    nombre: Optional[str] = None
    tarifa: Optional[str] = None
    tipo_tarifa: Optional[str] = None
    obs: Optional[str] = None
    extra_cols: Optional[dict[str, Any]] = None
    orden: Optional[int] = None


class ItemRead(BaseModel):
    id: uuid.UUID
    grupo_id: uuid.UUID
    nombre: str
    tarifa: str
    tipo_tarifa: str
    obs: Optional[str]
    extra_cols: dict[str, Any]
    orden: int

    model_config = {"from_attributes": True}

    @field_validator("extra_cols", mode="before")
    @classmethod
    def parse_extra_cols(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else {}
        return v or {}


# ---------- Grupos ----------

class GrupoCreate(BaseModel):
    linea_id: uuid.UUID
    nombre: str
    orden: int = 0


class GrupoUpdate(BaseModel):
    nombre: Optional[str] = None
    orden: Optional[int] = None


class GrupoRead(BaseModel):
    id: uuid.UUID
    linea_id: uuid.UUID
    nombre: str
    orden: int
    items: list[ItemRead] = []

    model_config = {"from_attributes": True}


# ---------- Observaciones ----------

class ObservacionCreate(BaseModel):
    linea_id: uuid.UUID
    nombre: str
    html: str
    orden: int = 0


class ObservacionUpdate(BaseModel):
    nombre: Optional[str] = None
    html: Optional[str] = None
    orden: Optional[int] = None


class ObservacionRead(BaseModel):
    id: uuid.UUID
    linea_id: uuid.UUID
    nombre: str
    html: str
    orden: int

    model_config = {"from_attributes": True}


# ---------- Lineas ----------

class LineasColumnasUpdate(BaseModel):
    columnas: list[dict[str, str]]  # [{id: str, nombre: str}, ...]


class LineaRead(BaseModel):
    id: uuid.UUID
    nombre: str
    columnas: list[dict[str, str]]
    orden: int
    grupos: list[GrupoRead] = []
    observaciones: list[ObservacionRead] = []

    model_config = {"from_attributes": True}

    @field_validator("columnas", mode="before")
    @classmethod
    def parse_columnas(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v or []

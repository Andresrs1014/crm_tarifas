import json
import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, field_validator


class ContactoCreate(BaseModel):
    nombre: str
    cargo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    orden: int = 0
    cumpleanos: Optional[date] = None
    recibe_regalos: Optional[str] = None  # si|no|tal_vez
    direccion: Optional[str] = None


class ContactoUpdate(BaseModel):
    nombre: Optional[str] = None
    cargo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    orden: Optional[int] = None
    cumpleanos: Optional[date] = None
    recibe_regalos: Optional[str] = None
    fotos_entrega: Optional[list[str]] = None
    fotos_fda: Optional[list[str]] = None
    fda_entregado: Optional[bool] = None
    direccion: Optional[str] = None


class ContactoRead(BaseModel):
    id: uuid.UUID
    record_id: uuid.UUID
    nombre: str
    cargo: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    orden: int
    cumpleanos: Optional[date]
    recibe_regalos: Optional[str]
    fotos_entrega: list[str]
    fotos_fda: list[str]
    fda_entregado: Optional[bool]
    direccion: Optional[str]

    model_config = {"from_attributes": True}

    @field_validator("fotos_entrega", mode="before")
    @classmethod
    def parse_fotos_entrega(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v or []

    @field_validator("fotos_fda", mode="before")
    @classmethod
    def parse_fotos_fda(cls, v):
        if isinstance(v, str):
            return json.loads(v) if v else []
        return v or []

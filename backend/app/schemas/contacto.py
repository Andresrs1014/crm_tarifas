import uuid
from typing import Optional

from pydantic import BaseModel


class ContactoCreate(BaseModel):
    nombre: str
    cargo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    orden: int = 0


class ContactoUpdate(BaseModel):
    nombre: Optional[str] = None
    cargo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    orden: Optional[int] = None


class ContactoRead(BaseModel):
    id: uuid.UUID
    record_id: uuid.UUID
    nombre: str
    cargo: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    orden: int

    model_config = {"from_attributes": True}

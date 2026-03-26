import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class ComercialCreate(BaseModel):
    nombre: str
    cargo: Optional[str] = None
    email: Optional[EmailStr] = None
    tel: Optional[str] = None


class ComercialUpdate(BaseModel):
    nombre: Optional[str] = None
    cargo: Optional[str] = None
    email: Optional[EmailStr] = None
    tel: Optional[str] = None
    activo: Optional[bool] = None


class ComercialRead(BaseModel):
    id: uuid.UUID
    nombre: str
    cargo: Optional[str]
    email: Optional[str]
    tel: Optional[str]
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}

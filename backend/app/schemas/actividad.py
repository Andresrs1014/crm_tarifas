import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ActividadCreate(BaseModel):
    tipo: str  # visit | service | invoice | note
    descripcion: str
    fecha: date


class ActividadRead(BaseModel):
    id: uuid.UUID
    record_id: uuid.UUID
    tipo: str
    descripcion: str
    fecha: date
    created_at: datetime

    model_config = {"from_attributes": True}

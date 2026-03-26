import uuid
from datetime import date, datetime

from sqlmodel import Field, SQLModel


class Actividad(SQLModel, table=True):
    __tablename__ = "actividades"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    record_id: uuid.UUID = Field(
        foreign_key="records.id", index=True, nullable=False
    )
    tipo: str = Field(nullable=False)  # visit | service | invoice | note
    descripcion: str = Field(nullable=False)
    fecha: date = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

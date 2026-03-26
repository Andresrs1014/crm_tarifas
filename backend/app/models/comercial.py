import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Comercial(SQLModel, table=True):
    __tablename__ = "comerciales"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    nombre: str = Field(nullable=False)
    cargo: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None, unique=True, index=True)
    tel: Optional[str] = Field(default=None)
    activo: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

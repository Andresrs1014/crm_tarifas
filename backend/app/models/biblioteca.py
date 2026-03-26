import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


class BibliotecaLinea(SQLModel, table=True):
    __tablename__ = "biblioteca_lineas"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    nombre: str = Field(unique=True, nullable=False)
    columnas: Optional[str] = Field(default="[]")  # JSON: [{id, nombre}, ...]
    orden: int = Field(default=0, nullable=False)


class BibliotecaGrupo(SQLModel, table=True):
    __tablename__ = "biblioteca_grupos"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    linea_id: uuid.UUID = Field(foreign_key="biblioteca_lineas.id", index=True, nullable=False)
    nombre: str = Field(nullable=False)
    orden: int = Field(default=0, nullable=False)


class BibliotecaItem(SQLModel, table=True):
    __tablename__ = "biblioteca_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    grupo_id: uuid.UUID = Field(foreign_key="biblioteca_grupos.id", index=True, nullable=False)
    nombre: str = Field(nullable=False)
    tarifa: str = Field(nullable=False)        # '559.900' | '0,36%'
    tipo_tarifa: str = Field(nullable=False)   # 'moneda' | 'porcentaje'
    obs: Optional[str] = Field(default=None)
    extra_cols: Optional[str] = Field(default="{}")  # JSON: {col_id: valor}
    orden: int = Field(default=0, nullable=False)


class BibliotecaObservacion(SQLModel, table=True):
    __tablename__ = "biblioteca_observaciones"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    linea_id: uuid.UUID = Field(foreign_key="biblioteca_lineas.id", index=True, nullable=False)
    nombre: str = Field(nullable=False)
    html: str = Field(nullable=False)
    orden: int = Field(default=0, nullable=False)

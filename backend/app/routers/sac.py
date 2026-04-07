import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.contacto import Contacto
from app.models.record import Record
from app.models.user import User

router = APIRouter(prefix="/sac", tags=["sac"])


class SACContactoRead(BaseModel):
    id: str
    record_id: str
    empresa: str
    nombre: str
    cargo: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    cumpleanos: Optional[str]       # YYYY-MM-DD
    recibe_regalos: Optional[str]
    fotos_entrega: list[str]
    fotos_fda: list[str]
    fda_entregado: Optional[bool]
    direccion: Optional[str]
    orden: int

    @field_validator("fotos_entrega", "fotos_fda", mode="before")
    @classmethod
    def parse_json_list(cls, v: Any) -> list[str]:
        if isinstance(v, list):
            return v
        if v is None or v == "":
            return []
        try:
            parsed = json.loads(v)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    model_config = {"from_attributes": True}


class FotosUpdate(BaseModel):
    fotos_entrega: Optional[list[str]] = None
    fotos_fda: Optional[list[str]] = None
    fda_entregado: Optional[bool] = None


@router.get("/contactos", response_model=list[SACContactoRead])
def list_sac_contactos(
    mes: Optional[int] = None,          # 1-12: filtrar por mes de cumpleaños
    recibe_regalos: Optional[str] = None,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    """Retorna todos los contactos con datos SAC, opcionalmente filtrados."""
    rows = session.exec(
        select(Contacto, Record)
        .join(Record, Contacto.record_id == Record.id)
        .order_by(Contacto.cumpleanos)
    ).all()

    results = []
    for contacto, record in rows:
        if mes is not None:
            if not contacto.cumpleanos:
                continue
            cumple_str = str(contacto.cumpleanos)  # 'YYYY-MM-DD'
            try:
                mes_contacto = int(cumple_str.split("-")[1])
            except (IndexError, ValueError):
                continue
            if mes_contacto != mes:
                continue

        if recibe_regalos is not None:
            if contacto.recibe_regalos != recibe_regalos:
                continue

        results.append(
            SACContactoRead(
                id=str(contacto.id),
                record_id=str(record.id),
                empresa=record.empresa,
                nombre=contacto.nombre,
                cargo=contacto.cargo,
                telefono=contacto.telefono,
                email=contacto.email,
                cumpleanos=str(contacto.cumpleanos) if contacto.cumpleanos else None,
                recibe_regalos=contacto.recibe_regalos,
                fotos_entrega=contacto.fotos_entrega,
                fotos_fda=contacto.fotos_fda,
                fda_entregado=contacto.fda_entregado,
                direccion=contacto.direccion,
                orden=contacto.orden,
            )
        )
    return results


@router.patch(
    "/contactos/{contacto_id}/fotos",
    response_model=SACContactoRead,
)
def update_fotos(
    contacto_id: uuid.UUID,
    data: FotosUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    """Actualiza fotos_entrega, fotos_fda y fda_entregado de un contacto."""
    contacto = session.get(Contacto, contacto_id)
    if not contacto:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")

    record = session.get(Record, contacto.record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record no encontrado")

    if data.fotos_entrega is not None:
        contacto.fotos_entrega = json.dumps(data.fotos_entrega)
    if data.fotos_fda is not None:
        contacto.fotos_fda = json.dumps(data.fotos_fda)
    if data.fda_entregado is not None:
        contacto.fda_entregado = data.fda_entregado

    session.add(contacto)
    session.commit()
    session.refresh(contacto)

    return SACContactoRead(
        id=str(contacto.id),
        record_id=str(record.id),
        empresa=record.empresa,
        nombre=contacto.nombre,
        cargo=contacto.cargo,
        telefono=contacto.telefono,
        email=contacto.email,
        cumpleanos=str(contacto.cumpleanos) if contacto.cumpleanos else None,
        recibe_regalos=contacto.recibe_regalos,
        fotos_entrega=contacto.fotos_entrega,
        fotos_fda=contacto.fotos_fda,
        fda_entregado=contacto.fda_entregado,
        direccion=contacto.direccion,
        orden=contacto.orden,
    )

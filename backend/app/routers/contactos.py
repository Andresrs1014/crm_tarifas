import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.contacto import Contacto
from app.models.record import Record
from app.models.user import User
from app.schemas.contacto import ContactoCreate, ContactoRead, ContactoUpdate

router = APIRouter(tags=["contactos"])


@router.get("/records/{record_id}/contactos", response_model=list[ContactoRead])
def list_contactos(
    record_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(Record, record_id):
        raise HTTPException(status_code=404, detail="Record no encontrado")
    return session.exec(
        select(Contacto)
        .where(Contacto.record_id == record_id)
        .order_by(Contacto.orden)
    ).all()


@router.post(
    "/records/{record_id}/contactos",
    response_model=ContactoRead,
    status_code=status.HTTP_201_CREATED,
)
def add_contacto(
    record_id: uuid.UUID,
    data: ContactoCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(Record, record_id):
        raise HTTPException(status_code=404, detail="Record no encontrado")
    contacto = Contacto(record_id=record_id, **data.model_dump())
    session.add(contacto)
    session.commit()
    session.refresh(contacto)
    return contacto


@router.put(
    "/records/{record_id}/contactos/{contacto_id}",
    response_model=ContactoRead,
)
def update_contacto(
    record_id: uuid.UUID,
    contacto_id: uuid.UUID,
    data: ContactoUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    contacto = session.get(Contacto, contacto_id)
    if not contacto or contacto.record_id != record_id:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contacto, key, value)
    session.add(contacto)
    session.commit()
    session.refresh(contacto)
    return contacto


@router.delete(
    "/records/{record_id}/contactos/{contacto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_contacto(
    record_id: uuid.UUID,
    contacto_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    contacto = session.get(Contacto, contacto_id)
    if not contacto or contacto.record_id != record_id:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    session.delete(contacto)
    session.commit()

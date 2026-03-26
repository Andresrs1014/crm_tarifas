import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user, require_superadmin
from app.database import get_session
from app.models.comercial import Comercial
from app.models.record import Record
from app.models.user import User
from app.schemas.comercial import ComercialCreate, ComercialRead, ComercialUpdate

router = APIRouter(prefix="/comerciales", tags=["comerciales"])


@router.get("/", response_model=list[ComercialRead])
def list_comerciales(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    return session.exec(select(Comercial).order_by(Comercial.nombre)).all()


@router.post("/", response_model=ComercialRead, status_code=status.HTTP_201_CREATED)
def create_comercial(
    data: ComercialCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_superadmin),
):
    if data.email and session.exec(
        select(Comercial).where(Comercial.email == data.email)
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un comercial con ese email",
        )
    comercial = Comercial(**data.model_dump())
    session.add(comercial)
    session.commit()
    session.refresh(comercial)
    return comercial


@router.get("/{comercial_id}", response_model=ComercialRead)
def get_comercial(
    comercial_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    comercial = session.get(Comercial, comercial_id)
    if not comercial:
        raise HTTPException(status_code=404, detail="Comercial no encontrado")
    return comercial


@router.put("/{comercial_id}", response_model=ComercialRead)
def update_comercial(
    comercial_id: uuid.UUID,
    data: ComercialUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_superadmin),
):
    comercial = session.get(Comercial, comercial_id)
    if not comercial:
        raise HTTPException(status_code=404, detail="Comercial no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(comercial, key, value)
    session.add(comercial)
    session.commit()
    session.refresh(comercial)
    return comercial


@router.delete("/{comercial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comercial(
    comercial_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(require_superadmin),
):
    comercial = session.get(Comercial, comercial_id)
    if not comercial:
        raise HTTPException(status_code=404, detail="Comercial no encontrado")
    tiene_records = session.exec(
        select(Record).where(Record.comercial_id == comercial_id)
    ).first()
    if tiene_records:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar: el comercial tiene records asociados",
        )
    session.delete(comercial)
    session.commit()

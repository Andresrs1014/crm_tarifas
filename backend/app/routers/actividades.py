import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.actividad import Actividad
from app.models.record import Record
from app.models.user import User
from app.schemas.actividad import ActividadCreate, ActividadRead

router = APIRouter(tags=["actividades"])


@router.get("/records/{record_id}/actividades", response_model=list[ActividadRead])
def list_actividades(
    record_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(Record, record_id):
        raise HTTPException(status_code=404, detail="Record no encontrado")
    return session.exec(
        select(Actividad)
        .where(Actividad.record_id == record_id)
        .order_by(Actividad.fecha.desc())
    ).all()


@router.post(
    "/records/{record_id}/actividades",
    response_model=ActividadRead,
    status_code=status.HTTP_201_CREATED,
)
def add_actividad(
    record_id: uuid.UUID,
    data: ActividadCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(Record, record_id):
        raise HTTPException(status_code=404, detail="Record no encontrado")
    actividad = Actividad(record_id=record_id, **data.model_dump())
    session.add(actividad)
    session.commit()
    session.refresh(actividad)
    return actividad


@router.delete(
    "/records/{record_id}/actividades/{actividad_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_actividad(
    record_id: uuid.UUID,
    actividad_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    actividad = session.get(Actividad, actividad_id)
    if not actividad or actividad.record_id != record_id:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    session.delete(actividad)
    session.commit()

import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.actividad import Actividad
from app.models.contacto import Contacto
from app.models.record import Record
from app.models.user import User
from app.schemas.actividad import ActividadRead
from app.schemas.contacto import ContactoRead
from app.schemas.record import RecordCreate, RecordRead, RecordReadDetalle, RecordUpdate

router = APIRouter(prefix="/records", tags=["records"])


def _to_db(data: dict) -> dict:
    """Serializa list/dict a JSON string para columnas TEXT."""
    if "servicios" in data:
        data["servicios"] = json.dumps(data["servicios"])
    if "facturacion_lineas" in data:
        data["facturacion_lineas"] = json.dumps(data["facturacion_lineas"])
    return data


def _build_detalle(record: Record, session: Session) -> RecordReadDetalle:
    contactos = session.exec(
        select(Contacto)
        .where(Contacto.record_id == record.id)
        .order_by(Contacto.orden)
    ).all()
    actividades = session.exec(
        select(Actividad)
        .where(Actividad.record_id == record.id)
        .order_by(Actividad.fecha.desc())
    ).all()
    base = RecordRead.model_validate(record)
    return RecordReadDetalle(
        **base.model_dump(),
        contactos=[ContactoRead.model_validate(c) for c in contactos],
        actividades=[ActividadRead.model_validate(a) for a in actividades],
    )


@router.get("/", response_model=list[RecordRead])
def list_records(
    tipo: Optional[str] = Query(None, description="prospecto | cliente"),
    comercial_id: Optional[uuid.UUID] = Query(None),
    estado_prospecto: Optional[str] = Query(None),
    estado_cliente: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Búsqueda por empresa o NIT"),
    fecha_desde: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_hasta: Optional[str] = Query(None, description="YYYY-MM-DD"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    query = select(Record)
    if tipo:
        query = query.where(Record.tipo == tipo)
    if comercial_id:
        query = query.where(Record.comercial_id == comercial_id)
    if estado_prospecto:
        query = query.where(Record.estado_prospecto == estado_prospecto)
    if estado_cliente:
        query = query.where(Record.estado_cliente == estado_cliente)
    if search:
        query = query.where(
            Record.empresa.ilike(f"%{search}%") | Record.nit.ilike(f"%{search}%")
        )
    if fecha_desde:
        query = query.where(Record.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.where(Record.fecha <= fecha_hasta)
    records = session.exec(query.order_by(Record.created_at.desc())).all()
    return [RecordRead.model_validate(r) for r in records]


@router.post("/", response_model=RecordReadDetalle, status_code=status.HTTP_201_CREATED)
def create_record(
    data: RecordCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    contactos_data = data.contactos
    record_data = _to_db(data.model_dump(exclude={"contactos"}))
    record = Record(**record_data)
    session.add(record)
    session.flush()  # genera el ID sin commit

    for contacto_in in contactos_data:
        session.add(Contacto(record_id=record.id, **contacto_in.model_dump()))

    session.commit()
    session.refresh(record)
    return _build_detalle(record, session)


@router.get("/{record_id}", response_model=RecordReadDetalle)
def get_record(
    record_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    record = session.get(Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record no encontrado")
    return _build_detalle(record, session)


@router.put("/{record_id}", response_model=RecordReadDetalle)
def update_record(
    record_id: uuid.UUID,
    data: RecordUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    record = session.get(Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record no encontrado")
    update_data = _to_db(data.model_dump(exclude_unset=True))
    update_data["updated_at"] = datetime.utcnow()
    for key, value in update_data.items():
        setattr(record, key, value)
    session.add(record)
    session.commit()
    session.refresh(record)
    return _build_detalle(record, session)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    record = session.get(Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record no encontrado")
    for row in session.exec(select(Contacto).where(Contacto.record_id == record_id)).all():
        session.delete(row)
    for row in session.exec(select(Actividad).where(Actividad.record_id == record_id)).all():
        session.delete(row)
    session.delete(record)
    session.commit()



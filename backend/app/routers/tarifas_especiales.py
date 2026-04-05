import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.tarifa_especial import TarifaEspecial
from app.models.user import User
from app.schemas.cotizacion import TarifaEspecialCreate, TarifaEspecialRead, TarifaEspecialUpdate

router = APIRouter(prefix="/tarifas-especiales", tags=["tarifas-especiales"])


@router.get("/", response_model=list[TarifaEspecialRead])
def list_tarifas(
    servicio: Optional[str] = Query(None, description="Filtrar por servicio"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    query = select(TarifaEspecial)
    if servicio:
        query = query.where(TarifaEspecial.servicio == servicio)
    return session.exec(query.order_by(TarifaEspecial.nombre)).all()


@router.post("/", response_model=TarifaEspecialRead, status_code=status.HTTP_201_CREATED)
def create_tarifa(
    data: TarifaEspecialCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    tarifa = TarifaEspecial(
        nombre=data.nombre,
        servicio=data.servicio,
        grupos=json.dumps(data.grupos),
    )
    session.add(tarifa)
    session.commit()
    session.refresh(tarifa)
    return tarifa


@router.get("/{tarifa_id}", response_model=TarifaEspecialRead)
def get_tarifa(
    tarifa_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    tarifa = session.get(TarifaEspecial, tarifa_id)
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa especial no encontrada")
    return tarifa


@router.put("/{tarifa_id}", response_model=TarifaEspecialRead)
def update_tarifa(
    tarifa_id: uuid.UUID,
    data: TarifaEspecialUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    tarifa = session.get(TarifaEspecial, tarifa_id)
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa especial no encontrada")
    update_data = data.model_dump(exclude_unset=True)
    if "grupos" in update_data:
        update_data["grupos"] = json.dumps(update_data["grupos"])
    update_data["updated_at"] = datetime.utcnow()
    for key, value in update_data.items():
        setattr(tarifa, key, value)
    session.add(tarifa)
    session.commit()
    session.refresh(tarifa)
    return tarifa


@router.delete("/{tarifa_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tarifa(
    tarifa_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    tarifa = session.get(TarifaEspecial, tarifa_id)
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa especial no encontrada")
    session.delete(tarifa)
    session.commit()

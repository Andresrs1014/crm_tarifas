import copy
import json
import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.cotizacion import Cotizacion
from app.models.user import User
from app.schemas.cotizacion import (
    ActualizarTarifasBody,
    CotizacionCreate,
    CotizacionRead,
    CotizacionUpdate,
)

router = APIRouter(prefix="/cotizaciones", tags=["cotizaciones"])


# ---------- Helpers ----------

def _to_db(data: dict) -> dict:
    """Serializa campos Python a JSON string para columnas TEXT."""
    for field in ("lineas", "items_snapshot", "obs_plantillas", "tarifa_tipo", "tarifa_especial_id"):
        if field in data:
            data[field] = json.dumps(data[field], ensure_ascii=False)
    return data


def _generar_numero(session: Session) -> str:
    """Incrementa el counter atómico y devuelve el siguiente número COT-XXX."""
    session.execute(
        text("UPDATE cot_numero_counter SET counter = counter + 1 WHERE id = 1")
    )
    result = session.execute(
        text("SELECT counter FROM cot_numero_counter WHERE id = 1")
    ).first()
    return f"COT-{result[0]:03d}"


def _parse_tarifa_moneda(tarifa: str) -> float:
    """'559.900' → 559900.0  (punto = separador de miles en Colombia)"""
    return float(tarifa.replace(".", ""))


def _format_tarifa_moneda(value: float) -> str:
    """559900.0 → '559.900'"""
    return f"{int(round(value)):,}".replace(",", ".")


def _aplicar_porcentaje(
    snapshot: dict, porcentaje: float, items_keys: list[str]
) -> dict:
    """Deep clone del snapshot con tarifas moneda incrementadas según items_keys."""
    nuevo = copy.deepcopy(snapshot)
    for linea_data in nuevo.values():
        for grupo_data in linea_data.values():
            for item in grupo_data.get("items", []):
                if (
                    item.get("nombre") in items_keys
                    and item.get("tipo_tarifa") == "moneda"
                ):
                    valor_actual = _parse_tarifa_moneda(item["tarifa"])
                    item["tarifa"] = _format_tarifa_moneda(
                        valor_actual * (1 + porcentaje / 100)
                    )
    return nuevo


# ---------- Endpoints ----------

@router.get("/public/{numero}", response_model=CotizacionRead, tags=["público"])
def get_cotizacion_publica(
    numero: str,
    session: Session = Depends(get_session),
):
    """Endpoint público sin autenticación. Normaliza COT001 → COT-001."""
    if not numero.startswith("COT-"):
        numero = f"COT-{numero.replace('COT', '')}"
    cot = session.exec(
        select(Cotizacion).where(Cotizacion.numero == numero)
    ).first()
    if not cot:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return CotizacionRead.model_validate(cot)


@router.get("/", response_model=list[CotizacionRead])
def list_cotizaciones(
    estado: Optional[str] = Query(None),
    comercial_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None, description="Búsqueda por empresa, NIT o número"),
    fecha_desde: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_hasta: Optional[str] = Query(None, description="YYYY-MM-DD"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    query = select(Cotizacion)
    if estado:
        query = query.where(Cotizacion.estado == estado)
    if comercial_id:
        query = query.where(Cotizacion.comercial_id == comercial_id)
    if search:
        query = query.where(
            Cotizacion.empresa.ilike(f"%{search}%")
            | Cotizacion.nit.ilike(f"%{search}%")
            | Cotizacion.numero.ilike(f"%{search}%")
        )
    if fecha_desde:
        query = query.where(Cotizacion.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.where(Cotizacion.fecha <= fecha_hasta)
    cots = session.exec(query.order_by(Cotizacion.created_at.desc())).all()
    return [CotizacionRead.model_validate(c) for c in cots]


@router.post("/", response_model=CotizacionRead, status_code=status.HTTP_201_CREATED)
def create_cotizacion(
    data: CotizacionCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    numero = _generar_numero(session)
    cot_data = _to_db(data.model_dump())
    cot = Cotizacion(numero=numero, **cot_data)
    session.add(cot)
    session.commit()
    session.refresh(cot)
    return CotizacionRead.model_validate(cot)


@router.get("/{cotizacion_id}", response_model=CotizacionRead)
def get_cotizacion(
    cotizacion_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    cot = session.get(Cotizacion, cotizacion_id)
    if not cot:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return CotizacionRead.model_validate(cot)


@router.put("/{cotizacion_id}", response_model=CotizacionRead)
def update_cotizacion(
    cotizacion_id: uuid.UUID,
    data: CotizacionUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    cot = session.get(Cotizacion, cotizacion_id)
    if not cot:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    update_data = _to_db(data.model_dump(exclude_unset=True))
    update_data["updated_at"] = datetime.utcnow()
    for key, value in update_data.items():
        setattr(cot, key, value)
    session.add(cot)
    session.commit()
    session.refresh(cot)
    return CotizacionRead.model_validate(cot)


@router.delete("/{cotizacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cotizacion(
    cotizacion_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    cot = session.get(Cotizacion, cotizacion_id)
    if not cot:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    session.delete(cot)
    session.commit()


@router.post("/{cotizacion_id}/duplicar", response_model=CotizacionRead, status_code=status.HTTP_201_CREATED)
def duplicar_cotizacion(
    cotizacion_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    """Copia la cotización como borrador con número nuevo y fecha de hoy."""
    original = session.get(Cotizacion, cotizacion_id)
    if not original:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    numero = _generar_numero(session)
    nueva = Cotizacion(
        numero=numero,
        empresa=original.empresa,
        nit=original.nit,
        record_id=original.record_id,
        contacto=original.contacto,
        cargo=original.cargo,
        email=original.email,
        telefono=original.telefono,
        comercial_id=original.comercial_id,
        fecha=date.today(),
        vigencia=original.vigencia,
        estado="borrador",
        asunto=original.asunto,
        lineas=original.lineas,
        items_snapshot=original.items_snapshot,  # JSON string — ya es deep clone
        obs_plantillas=original.obs_plantillas,
        obs_libre=original.obs_libre,
    )
    session.add(nueva)
    session.commit()
    session.refresh(nueva)
    return CotizacionRead.model_validate(nueva)


@router.post("/{cotizacion_id}/actualizar-tarifas", response_model=CotizacionRead, status_code=status.HTTP_201_CREATED)
def actualizar_tarifas(
    cotizacion_id: uuid.UUID,
    body: ActualizarTarifasBody,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    """
    Crea una NUEVA cotización con tarifas moneda incrementadas.
    No modifica la cotización original.
    Solo aplica a items con tipo_tarifa='moneda' cuyos nombres estén en items_keys.
    """
    original = session.get(Cotizacion, cotizacion_id)
    if not original:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    snapshot_original = json.loads(original.items_snapshot)
    snapshot_nuevo = _aplicar_porcentaje(snapshot_original, body.porcentaje, body.items_keys)

    numero = _generar_numero(session)
    nueva = Cotizacion(
        numero=numero,
        empresa=original.empresa,
        nit=original.nit,
        record_id=original.record_id,
        contacto=original.contacto,
        cargo=original.cargo,
        email=original.email,
        telefono=original.telefono,
        comercial_id=original.comercial_id,
        fecha=date.today(),
        vigencia=original.vigencia,
        estado="borrador",
        asunto=original.asunto,
        lineas=original.lineas,
        items_snapshot=json.dumps(snapshot_nuevo, ensure_ascii=False),
        obs_plantillas=original.obs_plantillas,
        obs_libre=original.obs_libre,
    )
    session.add(nueva)
    session.commit()
    session.refresh(nueva)
    return CotizacionRead.model_validate(nueva)

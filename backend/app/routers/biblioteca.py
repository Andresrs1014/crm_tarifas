import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth.dependencies import get_current_active_user, require_superadmin
from app.database import get_session
from app.models.biblioteca import (
    BibliotecaGrupo,
    BibliotecaItem,
    BibliotecaLinea,
    BibliotecaObservacion,
)
from app.models.user import User
from app.schemas.biblioteca import (
    GrupoCreate,
    GrupoRead,
    GrupoUpdate,
    ItemCreate,
    ItemRead,
    ItemUpdate,
    LineasColumnasUpdate,
    LineaRead,
    ObservacionCreate,
    ObservacionRead,
    ObservacionUpdate,
)

router = APIRouter(prefix="/biblioteca", tags=["biblioteca"])


# ---------- Árbol completo ----------

@router.get("/", response_model=list[LineaRead])
def get_biblioteca(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    lineas = session.exec(select(BibliotecaLinea).order_by(BibliotecaLinea.orden)).all()
    result = []
    for linea in lineas:
        grupos_db = session.exec(
            select(BibliotecaGrupo)
            .where(BibliotecaGrupo.linea_id == linea.id)
            .order_by(BibliotecaGrupo.orden)
        ).all()
        grupos = []
        for grupo in grupos_db:
            items_db = session.exec(
                select(BibliotecaItem)
                .where(BibliotecaItem.grupo_id == grupo.id)
                .order_by(BibliotecaItem.orden)
            ).all()
            grupos.append(GrupoRead(
                **grupo.model_dump(),
                items=[ItemRead.model_validate(i) for i in items_db],
            ))
        observaciones = session.exec(
            select(BibliotecaObservacion)
            .where(BibliotecaObservacion.linea_id == linea.id)
            .order_by(BibliotecaObservacion.orden)
        ).all()
        result.append(LineaRead(
            **{
                "id": linea.id,
                "nombre": linea.nombre,
                "columnas": json.loads(linea.columnas or "[]"),
                "orden": linea.orden,
            },
            grupos=grupos,
            observaciones=[ObservacionRead.model_validate(o) for o in observaciones],
        ))
    return result


# ---------- Lineas ----------

@router.put("/lineas/{linea_id}/columnas", response_model=LineaRead)
def update_columnas(
    linea_id: uuid.UUID,
    data: LineasColumnasUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_superadmin),
):
    linea = session.get(BibliotecaLinea, linea_id)
    if not linea:
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    linea.columnas = json.dumps(data.columnas)
    session.add(linea)
    session.commit()
    session.refresh(linea)
    # Retorna la línea sin árbol (solo datos base)
    return LineaRead(
        id=linea.id,
        nombre=linea.nombre,
        columnas=json.loads(linea.columnas),
        orden=linea.orden,
    )


# ---------- Grupos ----------

@router.post("/grupos", response_model=GrupoRead, status_code=status.HTTP_201_CREATED)
def create_grupo(
    data: GrupoCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(BibliotecaLinea, data.linea_id):
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    grupo = BibliotecaGrupo(**data.model_dump())
    session.add(grupo)
    session.commit()
    session.refresh(grupo)
    return GrupoRead(**grupo.model_dump())


@router.put("/grupos/{grupo_id}", response_model=GrupoRead)
def update_grupo(
    grupo_id: uuid.UUID,
    data: GrupoUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    grupo = session.get(BibliotecaGrupo, grupo_id)
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(grupo, key, value)
    session.add(grupo)
    session.commit()
    session.refresh(grupo)
    return GrupoRead(**grupo.model_dump())


@router.delete("/grupos/{grupo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grupo(
    grupo_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    grupo = session.get(BibliotecaGrupo, grupo_id)
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    for item in session.exec(
        select(BibliotecaItem).where(BibliotecaItem.grupo_id == grupo_id)
    ).all():
        session.delete(item)
    session.delete(grupo)
    session.commit()


# ---------- Items ----------

@router.post("/items", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(
    data: ItemCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(BibliotecaGrupo, data.grupo_id):
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    item_data = data.model_dump()
    item_data["extra_cols"] = json.dumps(item_data["extra_cols"])
    item = BibliotecaItem(**item_data)
    session.add(item)
    session.commit()
    session.refresh(item)
    return ItemRead.model_validate(item)


@router.put("/items/{item_id}", response_model=ItemRead)
def update_item(
    item_id: uuid.UUID,
    data: ItemUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    item = session.get(BibliotecaItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    if "extra_cols" in update_data:
        update_data["extra_cols"] = json.dumps(update_data["extra_cols"])
    for key, value in update_data.items():
        setattr(item, key, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return ItemRead.model_validate(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    item = session.get(BibliotecaItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    session.delete(item)
    session.commit()


# ---------- Observaciones ----------

@router.post(
    "/observaciones",
    response_model=ObservacionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_observacion(
    data: ObservacionCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    if not session.get(BibliotecaLinea, data.linea_id):
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    obs = BibliotecaObservacion(**data.model_dump())
    session.add(obs)
    session.commit()
    session.refresh(obs)
    return obs


@router.put("/observaciones/{obs_id}", response_model=ObservacionRead)
def update_observacion(
    obs_id: uuid.UUID,
    data: ObservacionUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    obs = session.get(BibliotecaObservacion, obs_id)
    if not obs:
        raise HTTPException(status_code=404, detail="Observación no encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obs, key, value)
    session.add(obs)
    session.commit()
    session.refresh(obs)
    return obs


@router.delete("/observaciones/{obs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observacion(
    obs_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    obs = session.get(BibliotecaObservacion, obs_id)
    if not obs:
        raise HTTPException(status_code=404, detail="Observación no encontrada")
    session.delete(obs)
    session.commit()

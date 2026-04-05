import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlmodel import Session

from app.auth.dependencies import get_current_active_user
from app.database import get_session
from app.models.user import User
from app.schemas.dashboard import (
    ChartPoint,
    ComercialActivity,
    DashboardCharts,
    DashboardStats,
    RankingEntry,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ---------- Helpers de filtros ----------

def _record_where(
    comercial_id: Optional[uuid.UUID],
    mes: Optional[str],
    tipo: Optional[str],
) -> tuple[str, dict]:
    """Construye cláusula WHERE y params para queries sobre records (alias r)."""
    conds = ["1=1"]
    params: dict = {}
    if comercial_id:
        conds.append("r.comercial_id = :comercial_id")
        params["comercial_id"] = str(comercial_id)
    if mes:
        conds.append("strftime('%Y-%m', r.created_at) = :mes")
        params["mes"] = mes
    if tipo:
        conds.append("r.tipo = :tipo")
        params["tipo"] = tipo
    return " AND ".join(conds), params


def _cot_where(
    comercial_id: Optional[uuid.UUID],
    mes: Optional[str],
) -> tuple[str, dict]:
    """Construye cláusula WHERE y params para queries sobre cotizaciones (alias c)."""
    conds = ["1=1"]
    params: dict = {}
    if comercial_id:
        conds.append("c.comercial_id = :comercial_id")
        params["comercial_id"] = str(comercial_id)
    if mes:
        conds.append("strftime('%Y-%m', c.created_at) = :mes")
        params["mes"] = mes
    return " AND ".join(conds), params


# ---------- /stats ----------

@router.get("/stats", response_model=DashboardStats)
def get_stats(
    comercial_id: Optional[uuid.UUID] = Query(None),
    mes: Optional[str] = Query(None, description="Formato YYYY-MM"),
    tipo: Optional[str] = Query(None, description="prospecto | cliente"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    rw, rp = _record_where(comercial_id, mes, tipo)
    cw, cp = _cot_where(comercial_id, mes)

    def rq(sql: str, params: dict = rp):
        return session.execute(text(sql), params)

    # Totales de records
    total_records = rq(f"SELECT COUNT(*) FROM records r WHERE {rw}").scalar() or 0

    # Prospectos y clientes por separado (respeta filtro tipo si aplica)
    rw_p = rw + (" AND r.tipo = 'prospecto'" if tipo != "prospecto" else "")
    rw_c = rw + (" AND r.tipo = 'cliente'"   if tipo != "cliente"   else "")
    if tipo == "cliente":
        rw_p = rw + " AND 1=0"
    if tipo == "prospecto":
        rw_c = rw + " AND 1=0"

    total_prospectos = rq(f"SELECT COUNT(*) FROM records r WHERE {rw_p}").scalar() or 0
    total_clientes   = rq(f"SELECT COUNT(*) FROM records r WHERE {rw_c}").scalar() or 0

    # Prospectos por estado
    rows = rq(f"""
        SELECT r.estado_prospecto, COUNT(*)
        FROM records r WHERE {rw_p} AND r.estado_prospecto IS NOT NULL
        GROUP BY r.estado_prospecto
    """).all()
    prospectos_por_estado = {r[0]: r[1] for r in rows}

    # Clientes por estado
    rows = rq(f"""
        SELECT r.estado_cliente, COUNT(*)
        FROM records r WHERE {rw_c} AND r.estado_cliente IS NOT NULL
        GROUP BY r.estado_cliente
    """).all()
    clientes_por_estado = {r[0]: r[1] for r in rows}

    # Total facturado: valor (clientes) + valor_p (prospectos)
    total_facturado = rq(f"""
        SELECT COALESCE(SUM(COALESCE(r.valor, 0) + COALESCE(r.valor_p, 0)), 0)
        FROM records r WHERE {rw}
    """).scalar() or 0

    # Facturación por línea desde facturacion_lineas JSON
    rows = rq(f"""
        SELECT j.key, SUM(CAST(j.value AS INTEGER))
        FROM records r, json_each(r.facturacion_lineas) j
        WHERE {rw}
          AND r.facturacion_lineas IS NOT NULL
          AND r.facturacion_lineas NOT IN ('null', '{{}}', '')
        GROUP BY j.key
    """).all()
    facturacion_por_linea = {r[0]: r[1] for r in rows}

    # Cotizaciones por estado
    rows = session.execute(
        text(f"SELECT c.estado, COUNT(*) FROM cotizaciones c WHERE {cw} GROUP BY c.estado"), cp
    ).all()
    cotizaciones_por_estado = {r[0]: r[1] for r in rows}
    total_cotizaciones = sum(cotizaciones_por_estado.values())

    return DashboardStats(
        total_records=total_records,
        total_prospectos=total_prospectos,
        total_clientes=total_clientes,
        prospectos_por_estado=prospectos_por_estado,
        clientes_por_estado=clientes_por_estado,
        total_facturado=int(total_facturado),
        facturacion_por_linea=facturacion_por_linea,
        cotizaciones_por_estado=cotizaciones_por_estado,
        total_cotizaciones=total_cotizaciones,
    )


# ---------- /charts ----------

@router.get("/charts", response_model=DashboardCharts)
def get_charts(
    comercial_id: Optional[uuid.UUID] = Query(None),
    mes: Optional[str] = Query(None, description="Formato YYYY-MM"),
    tipo: Optional[str] = Query(None, description="prospecto | cliente"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    rw, rp = _record_where(comercial_id, mes, tipo)
    cw, cp = _cot_where(comercial_id, mes)

    def rq(sql: str, params: dict = rp):
        return session.execute(text(sql), params)

    # Prospectos vs Clientes
    rows = rq(f"SELECT r.tipo, COUNT(*) FROM records r WHERE {rw} GROUP BY r.tipo").all()
    tipo_map = {"prospecto": "Prospectos", "cliente": "Clientes"}
    prospectos_vs_clientes = [
        ChartPoint(name=tipo_map.get(r[0], r[0]), value=r[1]) for r in rows
    ]

    # Pipeline de estados (prospectos + clientes combinados)
    rows = rq(f"""
        SELECT r.estado_prospecto AS estado, COUNT(*)
        FROM records r WHERE {rw} AND r.tipo='prospecto' AND r.estado_prospecto IS NOT NULL
        GROUP BY r.estado_prospecto
        UNION ALL
        SELECT r.estado_cliente AS estado, COUNT(*)
        FROM records r WHERE {rw} AND r.tipo='cliente' AND r.estado_cliente IS NOT NULL
        GROUP BY r.estado_cliente
    """).all()
    pipeline_estados = [ChartPoint(name=r[0], value=r[1]) for r in rows]

    # Servicios solicitados (desagrega records.servicios JSON array)
    rows = rq(f"""
        SELECT j.value, COUNT(*)
        FROM records r, json_each(r.servicios) j
        WHERE {rw}
          AND r.servicios IS NOT NULL
          AND r.servicios NOT IN ('null', '[]', '')
        GROUP BY j.value
        ORDER BY COUNT(*) DESC
    """).all()
    servicios_solicitados = [ChartPoint(name=r[0], value=r[1]) for r in rows]

    # Actividad por comercial
    rows = rq(f"""
        SELECT co.nombre, COUNT(a.id)
        FROM actividades a
        JOIN records r  ON r.id  = a.record_id
        JOIN comerciales co ON co.id = r.comercial_id
        WHERE {rw}
        GROUP BY co.id, co.nombre
        ORDER BY COUNT(a.id) DESC
    """).all()
    actividad_por_comercial = [ComercialActivity(name=r[0], total=r[1]) for r in rows]

    # Billing por línea (desde facturacion_lineas JSON)
    rows = rq(f"""
        SELECT j.key, SUM(CAST(j.value AS INTEGER))
        FROM records r, json_each(r.facturacion_lineas) j
        WHERE {rw}
          AND r.facturacion_lineas IS NOT NULL
          AND r.facturacion_lineas NOT IN ('null', '{{}}', '')
        GROUP BY j.key
        ORDER BY SUM(CAST(j.value AS INTEGER)) DESC
    """).all()
    billing_por_linea = [ChartPoint(name=r[0], value=r[1]) for r in rows]

    # Pipeline cotizaciones por estado
    rows = session.execute(
        text(f"""
            SELECT c.estado, COUNT(*)
            FROM cotizaciones c WHERE {cw}
            GROUP BY c.estado
        """), cp
    ).all()
    pipeline_cotizaciones = [ChartPoint(name=r[0], value=r[1]) for r in rows]

    # Líneas cotizadas (desagrega cotizaciones.lineas JSON array)
    rows = session.execute(
        text(f"""
            SELECT j.value, COUNT(*)
            FROM cotizaciones c, json_each(c.lineas) j
            WHERE {cw}
              AND c.lineas IS NOT NULL
              AND c.lineas NOT IN ('null', '[]', '')
            GROUP BY j.value
            ORDER BY COUNT(*) DESC
        """), cp
    ).all()
    lineas_cotizadas = [ChartPoint(name=r[0], value=r[1]) for r in rows]

    return DashboardCharts(
        prospectos_vs_clientes=prospectos_vs_clientes,
        pipeline_estados=pipeline_estados,
        servicios_solicitados=servicios_solicitados,
        actividad_por_comercial=actividad_por_comercial,
        billing_por_linea=billing_por_linea,
        pipeline_cotizaciones=pipeline_cotizaciones,
        lineas_cotizadas=lineas_cotizadas,
    )


# ---------- /ranking ----------

@router.get("/ranking", response_model=list[RankingEntry])
def get_ranking(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    """Ranking de gestión por comercial: prospectos, clientes, visitas, valor facturado."""
    rows = session.execute(text("""
        SELECT
            co.id               AS comercial_id,
            co.nombre           AS nombre,
            COUNT(DISTINCT CASE WHEN r.tipo = 'prospecto' THEN r.id END) AS prospectos,
            COUNT(DISTINCT CASE WHEN r.tipo = 'cliente'   THEN r.id END) AS clientes,
            COUNT(DISTINCT a.id)                                          AS visitas,
            COALESCE(SUM(COALESCE(r.valor, 0) + COALESCE(r.valor_p, 0)), 0) AS valor_facturado
        FROM comerciales co
        LEFT JOIN records r    ON r.comercial_id = co.id
        LEFT JOIN actividades a ON a.record_id   = r.id
        WHERE co.activo = 1
        GROUP BY co.id, co.nombre
        ORDER BY clientes DESC, prospectos DESC
    """)).all()

    return [
        RankingEntry(
            comercial_id=str(r[0]),
            nombre=r[1],
            prospectos=r[2] or 0,
            clientes=r[3] or 0,
            visitas=r[4] or 0,
            valor_facturado=r[5] or 0,
        )
        for r in rows
    ]

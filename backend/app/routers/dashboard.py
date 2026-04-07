import json
import uuid
from datetime import date
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
    CotizacionReciente,
    DashboardCharts,
    DashboardRecientes,
    DashboardStats,
    MonthPoint,
    RankingEntry,
    RecordReciente,
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

    # Cotizaciones en curso (borrador + enviada + negociacion)
    en_curso = sum(
        cotizaciones_por_estado.get(e, 0) for e in ("borrador", "enviada", "negociacion")
    )

    # Cotizaciones vencidas (vigencia < hoy, no aprobada ni rechazada)
    hoy = date.today().isoformat()
    vencidas_row = session.execute(
        text(f"""
            SELECT COUNT(*) FROM cotizaciones c
            WHERE {cw}
              AND c.vigencia < :hoy
              AND c.estado NOT IN ('aprobada','rechazada')
        """),
        {**cp, "hoy": hoy},
    ).scalar() or 0

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
        cotizaciones_en_curso=en_curso,
        cotizaciones_vencidas=int(vencidas_row),
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

    # Registros por mes (últimos 12 meses)
    rows = rq(f"""
        SELECT strftime('%Y-%m', r.fecha) AS mes,
               SUM(CASE WHEN r.tipo='prospecto' THEN 1 ELSE 0 END) AS prospectos,
               SUM(CASE WHEN r.tipo='cliente'   THEN 1 ELSE 0 END) AS clientes
        FROM records r WHERE {rw}
          AND r.fecha >= date('now', '-11 months', 'start of month')
        GROUP BY mes
        ORDER BY mes
    """)
    registros_por_mes = [
        MonthPoint(name=r[0], prospectos=r[1] or 0, clientes=r[2] or 0)
        for r in rows
    ]

    # Gestión clientes antiguos
    rw_c2 = rw + (" AND r.tipo='cliente'" if tipo != "cliente" else "")
    gestion_data = [
        ("Activos",     f"r.estado_cliente = 'activo'"),
        ("En Riesgo",   f"r.estado_cliente = 'en-riesgo'"),
        ("Inactivos",   f"r.estado_cliente = 'inactivo'"),
        ("Con Visita",  f"r.visita_cliente IS NOT NULL AND r.visita_cliente != 'no'"),
        ("Nuevo Svc",   f"r.nuevo_servicio = 'si'"),
        ("Facturados",  f"r.facturado IS NOT NULL AND r.facturado != 'no'"),
    ]
    gestion_clientes = []
    for label, cond in gestion_data:
        val = rq(
            f"SELECT COUNT(*) FROM records r WHERE {rw_c2} AND {cond}"
        ).scalar() or 0
        gestion_clientes.append(ChartPoint(name=label, value=int(val)))

    return DashboardCharts(
        prospectos_vs_clientes=prospectos_vs_clientes,
        pipeline_estados=pipeline_estados,
        servicios_solicitados=servicios_solicitados,
        actividad_por_comercial=actividad_por_comercial,
        billing_por_linea=billing_por_linea,
        pipeline_cotizaciones=pipeline_cotizaciones,
        lineas_cotizadas=lineas_cotizadas,
        registros_por_mes=registros_por_mes,
        gestion_clientes=gestion_clientes,
    )


# ---------- /recientes ----------

@router.get("/recientes", response_model=DashboardRecientes)
def get_recientes(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_user),
):
    """Últimos 8 registros y últimas 6 cotizaciones."""
    hoy = date.today().isoformat()

    # Últimos 8 records con nombre de comercial
    rec_rows = session.execute(text("""
        SELECT r.id, r.empresa, r.tipo, co.nombre, r.servicios,
               r.estado_prospecto, r.estado_cliente, r.fecha
        FROM records r
        LEFT JOIN comerciales co ON co.id = r.comercial_id
        ORDER BY r.created_at DESC
        LIMIT 8
    """)).all()

    registros = []
    for r in rec_rows:
        estado = r[5] if r[2] == "prospecto" else (r[6] or "")
        servicios = json.loads(r[4]) if r[4] and r[4] not in ("null", "[]") else []
        registros.append(RecordReciente(
            id=str(r[0]),
            empresa=r[1],
            tipo=r[2],
            comercial_nombre=r[3],
            servicios=servicios,
            estado=estado or "",
            fecha=str(r[7]),
        ))

    # Últimas 6 cotizaciones
    cot_rows = session.execute(text("""
        SELECT id, numero, empresa, lineas, estado, fecha, vigencia
        FROM cotizaciones
        ORDER BY created_at DESC
        LIMIT 6
    """)).all()

    cotizaciones = []
    for c in cot_rows:
        lineas = json.loads(c[3]) if c[3] and c[3] not in ("null", "[]") else []
        vencida = (
            str(c[6]) < hoy
            and c[4] not in ("aprobada", "rechazada")
        )
        cotizaciones.append(CotizacionReciente(
            id=str(c[0]),
            numero=c[1],
            empresa=c[2],
            lineas=lineas,
            estado=c[4],
            fecha=str(c[5]),
            vencida=vencida,
        ))

    return DashboardRecientes(registros=registros, cotizaciones=cotizaciones)


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

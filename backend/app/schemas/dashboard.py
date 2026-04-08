from pydantic import BaseModel
from typing import List


class ChartPoint(BaseModel):
    name: str
    value: int


class ComercialActivity(BaseModel):
    name: str
    total: int


class MonthPoint(BaseModel):
    name: str        # "YYYY-MM"
    prospectos: int
    clientes: int


class DashboardStats(BaseModel):
    total_records: int
    total_prospectos: int
    total_clientes: int
    prospectos_por_estado: dict[str, int]
    clientes_por_estado: dict[str, int]
    total_facturado: int
    facturacion_por_linea: dict[str, int]
    cotizaciones_por_estado: dict[str, int]
    total_cotizaciones: int
    cotizaciones_en_curso: int
    cotizaciones_vencidas: int


class RankingEntry(BaseModel):
    comercial_id: str
    nombre: str
    prospectos: int
    clientes: int
    visitas: int
    valor_facturado: int


class DashboardCharts(BaseModel):
    prospectos_vs_clientes: list[ChartPoint]
    pipeline_estados: list[ChartPoint]
    servicios_solicitados: list[ChartPoint]
    actividad_por_comercial: list[ComercialActivity]
    billing_por_linea: list[ChartPoint]
    pipeline_cotizaciones: list[ChartPoint]
    lineas_cotizadas: list[ChartPoint]
    registros_por_mes: list[MonthPoint]
    gestion_clientes: list[ChartPoint]


class RecordReciente(BaseModel):
    id: str
    empresa: str
    tipo: str
    comercial_nombre: str | None
    servicios: list[str]
    estado: str
    fecha: str


class CotizacionReciente(BaseModel):
    id: str
    numero: str
    empresa: str
    lineas: list[str]
    estado: str
    fecha: str
    vencida: bool


class DashboardRecientes(BaseModel):
    registros: list[RecordReciente]
    cotizaciones: list[CotizacionReciente]

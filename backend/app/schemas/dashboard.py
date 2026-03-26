from pydantic import BaseModel


class ChartPoint(BaseModel):
    name: str
    value: int


class ComercialActivity(BaseModel):
    name: str
    total: int


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


class DashboardCharts(BaseModel):
    prospectos_vs_clientes: list[ChartPoint]
    pipeline_estados: list[ChartPoint]
    servicios_solicitados: list[ChartPoint]
    actividad_por_comercial: list[ComercialActivity]
    billing_por_linea: list[ChartPoint]
    pipeline_cotizaciones: list[ChartPoint]
    lineas_cotizadas: list[ChartPoint]

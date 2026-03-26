# Fase 5 — Dashboard

## Descripción
Agregaciones SQL para KPIs y datos de gráficos.
Todo en dos endpoints para minimizar llamadas desde el frontend.

## Endpoints
GET /api/dashboard/stats?comercial_id=&mes=&tipo=
GET /api/dashboard/charts?comercial_id=&mes=&tipo=

## /api/dashboard/stats — respuesta
{
  "total_records": int,
  "total_prospectos": int,
  "total_clientes": int,
  "prospectos_por_estado": {"seguimiento": int, "cerrado": int, "perdido": int, "frio": int},
  "clientes_por_estado": {"activo": int, "en-riesgo": int, "inactivo": int},
  "total_facturado": int,  -- COP suma de valor + valor_p
  "facturacion_por_linea": {"Zona Franca": int, ...},
  "cotizaciones_por_estado": {"borrador": int, "enviada": int, "aprobada": int, ...},
  "total_cotizaciones": int
}

## /api/dashboard/charts — respuesta
{
  "prospectos_vs_clientes": [{"name": "Prospectos", "value": int}, ...],
  "pipeline_estados": [{"name": str, "value": int}, ...],
  "servicios_solicitados": [{"name": str, "value": int}, ...],  -- de records.servicios JSON
  "actividad_por_comercial": [{"name": str, "total": int}, ...],
  "billing_por_linea": [{"name": str, "value": int}, ...],
  "pipeline_cotizaciones": [{"name": str, "value": int}, ...],
  "lineas_cotizadas": [{"name": str, "value": int}, ...]  -- de cotizaciones.lineas JSON
}

## Filtros disponibles (query params opcionales)
- comercial_id: filtrar por comercial específico
- mes: formato YYYY-MM — filtrar por mes de creación
- tipo: 'prospecto' | 'cliente'

## Notas
- servicios_solicitados requiere desagregar el campo JSON records.servicios
- lineas_cotizadas requiere desagregar el campo JSON cotizaciones.lineas
- En SQLite usar json_each() para desagregar arrays JSON
- Todos los valores monetarios en COP entero (sin decimales)
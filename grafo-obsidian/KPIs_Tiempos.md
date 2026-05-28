#kpi

# KPIs y Tiempos

> **Tipo:** Nodo de métricas de desempeño
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Estados_del_Proceso]] · [[Motores_de_Datos]] · [[Actores_y_Roles]]

---

## KPIs del Pipeline

### Prospectos
| KPI | Fórmula | Meta |
|-----|---------|------|
| Total prospectos activos | COUNT(tipo=prospecto, estado≠perdido) | > 20 |
| Tasa de conversión | facturado / total × 100 | > 30% |
| Tiempo promedio propuesta→aceptación | AVG(fecha_aceptacion - fecha_propuesta) | < 15 días |
| Tiempo total ciclo | AVG(fecha_facturado - fecha_prospecto) | < 60 días |
| Prospectos fríos | COUNT(actividades=0, createdAt>30d) | < 10% del total |

### Clientes
| KPI | Fórmula | Meta |
|-----|---------|------|
| Clientes activos | COUNT(tipo=cliente, estadoCliente=activo) | crecimiento mes a mes |
| Clientes en riesgo | COUNT(estadoCliente=en-riesgo) | < 5% del total |
| Facturación total | SUM(valor) | Meta mensual definida por gerencia |
| Clientes sin visita | COUNT(visitaCliente=no) | < 20% |

### Cotizaciones
| KPI | Fórmula | Meta |
|-----|---------|------|
| Cotizaciones enviadas | COUNT(estado=enviada) | — |
| Tasa de aprobación | aprobadas / enviadas × 100 | > 40% |
| Tiempo enviada→respuesta | AVG(fecha_respuesta - fecha_envio) | < 7 días |
| Cotizaciones en negociación | COUNT(estado=negociacion) | monitoreo continuo |

### Equipo comercial
| KPI | Fórmula | Meta |
|-----|---------|------|
| Visitas por comercial | COUNT(actividades.tipo=visita) por comercial | > 4/mes |
| Prospectos por comercial | COUNT(prospectos asignados) | distribución equilibrada |
| Facturado por comercial | SUM(valor clientes) por comercial | ranking mensual |

---

## Tiempos críticos del proceso

| Punto de control | Tiempo máximo | Alerta si supera |
|-----------------|---------------|-----------------|
| Primer contacto tras nuevo prospecto | 24 horas | [[Alertas_y_Triggers]] |
| Envío de cotización desde propuesta | 3 días | Alerta interna |
| Seguimiento sin respuesta del cliente | 7 días | [[Flujos_Email]] reenvío |
| Onboarding (creacion_sop → facturado) | 15 días | Alerta gerencia |
| Revisita a cliente activo | 90 días | Badge "sin visita reciente" |

---

## KPIs calculados por el Dashboard

El endpoint `GET /api/dashboard` retorna:
- `total_prospectos`, `total_clientes`, `total_cotizaciones`
- `facturacion_total`
- `prospectos_por_estado` (para gráfica de barras pipeline)
- `registros_por_mes` (para gráfica de tendencia 12 meses)
- `servicios_frecuentes` (donut)
- `cotizaciones_por_estado` (donut)
- `actividad_por_comercial` (ranking)
- `facturacion_por_linea` (barras horizontales)

---

## Conexiones

- [[Motores_de_Datos]] — de dónde vienen los números
- [[Estados_del_Proceso]] — qué estados miden
- [[Actores_y_Roles]] — KPIs por actor
- [[Mente_ZYMO_SUBAGENT]] — interpreta y contextualiza KPIs
- [[Conexion_Sistema_Gerencial]] — KPIs que suben a gerencia

#gerencia #integracion

# Conexión al Sistema Gerencial — Zymo Dormido

> **Tipo:** Nodo de integración con zymo-intranet
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[KPIs_Tiempos]] · [[Motores_de_Datos]]

---

## ¿Qué es "Zymo Dormido"?

`Zymo Dormido` es el nombre del módulo de integración bidireccional entre el CRM y `zymo-intranet.com`. Está "dormido" porque la integración de datos aún no está activa — solo el SSO funciona hoy.

---

## Estado actual de la integración

| Canal | Estado | Descripción |
|-------|--------|-------------|
| SSO (login) | ✅ Activo | Token JWT compartido funciona |
| KPIs → Intranet | ⏸ Dormido | El dashboard del CRM podría alimentar widgets en la intranet |
| Alertas → Intranet | ⏸ Dormido | Notificaciones CRM en el panel de intranet |
| Clientes → Intranet | ⏸ Dormido | Listado compartido de clientes entre sistemas |
| Facturación → ERP | ⏸ Dormido | Exportar datos a sistema contable de Grupo ZYMO |

---

## Arquitectura de integración planeada

```
zymo-intranet (puerto 8001)
    │
    │ SSO Token JWT  ←──── ya funciona ✅
    ↓
CRM Backend (puerto 3003)
    │
    │ webhooks / polling futuros
    ↓
zymo-intranet Widgets
    - "Pipeline CRM" widget en dashboard de intranet
    - "Clientes en riesgo" badge en header
    - "SAC — Cumpleaños del mes" reminder
```

---

## Datos que fluirían hacia gerencia

### Desde CRM → Intranet (push semanal recomendado)
```json
{
  "fecha": "2026-05-28",
  "total_prospectos": 45,
  "total_clientes": 23,
  "facturacion_mes": 125000000,
  "cotizaciones_aprobadas": 8,
  "clientes_en_riesgo": 2,
  "top_comercial": "Juan Pérez",
  "pipeline_por_estado": { "propuesta": 12, "reconocimiento": 8 }
}
```

### Endpoint sugerido para implementar
```
GET /api/dashboard/resumen-gerencial
Authorization: Bearer <intranet-service-token>

Response: { semana, prospectos, clientes, facturacion, alertas }
```

---

## Cómo activar la integración

1. **Definir service token** — token especial para intranet, distinto a usuarios normales
2. **Crear endpoint protegido** — `GET /api/dashboard/resumen-gerencial`
3. **Widget en intranet** — iframe o fetch desde intranet hacia CRM
4. **Alertas en tiempo real** — WebSocket o polling cada 5 minutos

---

## Notas para el agente

Cuando el [[Mente_ZYMO_SUBAGENT]] reciba preguntas sobre reportes gerenciales:
- Responder con datos del endpoint `/api/dashboard` (disponible ya)
- Mencionar que la integración directa con intranet está planeada (Zymo Dormido)
- Para reportes urgentes → exportar desde la vista Ranking del Dashboard

---

## Conexiones

- [[ZYMO_CRM_AGENT]] — quien usa esta conexión
- [[KPIs_Tiempos]] — datos que fluyen
- [[Motores_de_Datos]] — origen de los datos
- [[Actores_y_Roles]] — Superadmin como receptor principal
- [[Mente_ZYMO_SUBAGENT]] — razona sobre el estado de la integración

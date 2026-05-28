#alerta

# Alertas y Triggers

> **Tipo:** Nodo de alertas del sistema
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Flujos_Email]] · [[Estados_del_Proceso]] · [[KPIs_Tiempos]]

---

## Alertas activas en el CRM

### 1. Seguimiento vencido
- **Trigger:** `proximoSeguimiento < fecha_actual`
- **Afecta:** Prospectos y clientes con fecha de seguimiento pasada
- **Dónde se muestra:** Banner rojo en [[Pipeline_Prospectos]] (Kanban)
- **Formato:** `⚠ N seguimiento(s) vencido(s): Empresa A, Empresa B...`
- **Acción sugerida:** Registrar actividad o actualizar fecha

### 2. Cliente en riesgo
- **Trigger:** `estadoCliente === "en-riesgo"`
- **Afecta:** Vista `/clientes`
- **Dónde se muestra:** Indicador `⚠ N en riesgo` en el subtítulo de Clientes
- **Acción sugerida:** Visita o llamada urgente → cambiar estado

### 3. Cumpleaños del mes (SAC)
- **Trigger:** `cumpleanos.includes("-MM-")` donde MM = mes actual
- **Afecta:** Contactos con `recibeRegalos: true`
- **Dónde se muestra:** [[SAC_Cumpleanos]] — alerta FDA pendiente
- **Acción sugerida:** Marcar FDA entregado + registrar foto

### 4. Cotización sin respuesta
- **Trigger:** `estado === "enviada"` y `updatedAt > 7 días`
- **Tipo:** Lógica de negocio (no implementada en UI, candidata a automatizar)
- **Acción sugerida:** [[Flujos_Email]] → reenviar seguimiento

### 5. Prospecto frío
- **Trigger:** `actividades vacías` y `createdAt > 30 días`
- **Tipo:** Calculado por [[Mente_ZYMO_SUBAGENT]]
- **Acción sugerida:** Llamada de reactivación o marcar `estadoProspecto: "frio"`

---

## Triggers del sistema

| Evento | Trigger | Respuesta |
|--------|---------|-----------|
| Nuevo registro | `POST /api/records` | Crear actividad inicial automática (sugerido) |
| Avance de estado | `PUT /api/records/:id` | Registrar timestamp en `CrmMeta` |
| Cotización enviada | `estado → "enviada"` | Notificación al comercial |
| FDA pendiente | `recibeRegalos && !fdaEntregado` | Aparece en alerta SAC |
| Login SSO | Token intranet válido | Crear/vincular usuario CRM |

---

## Conexiones

- [[Flujos_Email]] — alertas que generan emails
- [[KPIs_Tiempos]] — tiempo entre trigger y respuesta
- [[Mente_ZYMO_SUBAGENT]] — razonamiento sobre alertas
- [[SAC_Cumpleanos]] — alertas de SAC
- [[Pipeline_Prospectos]] — alertas en Kanban
- [[Estados_del_Proceso]] — qué estado activa qué alerta

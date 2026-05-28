#estado

# Estados del Proceso

> **Tipo:** Nodo de máquina de estados
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Alertas_y_Triggers]] · [[KPIs_Tiempos]] · [[Reglas_de_Negocio]]

---

## Pipeline de Prospectos

```
prospecto → reconocimiento → propuesta → aceptacion_propuesta → creacion_sop → facturado
                                  ↓
                                frio ← (sin actividad 30+ días)
                                  ↓
                               perdido
```

| Estado | Badge | Descripción |
|--------|-------|-------------|
| `prospecto` | 🔵 | Contacto inicial identificado |
| `reconocimiento` | 🟣 | Visita o llamada realizada |
| `propuesta` | 🟡 | Cotización enviada |
| `aceptacion_propuesta` | 🟢 | Cliente aceptó la propuesta |
| `creacion_sop` | 🟡 | Proceso de onboarding iniciado |
| `facturado` | 🟢 | Primera factura emitida → se convierte en cliente |
| `frio` | ⚫ | Sin actividad, en espera |
| `perdido` | 🔴 | Prospecto descartado |

**Transición a cliente:** Cuando `estadoProspecto === "facturado"`, el prospecto se puede duplicar como `tipo: "cliente"` con `estadoCliente: "activo"`.

---

## Estados de Clientes

| Estado | Badge | Descripción |
|--------|-------|-------------|
| `activo` | 🟢 | Cliente facturando normalmente |
| `en-riesgo` | 🔴 | Señales de pérdida detectadas — alerta activa |
| `inactivo` | ⚫ | Sin facturación activa |

---

## Pipeline de Cotizaciones

```
borrador → enviada → negociacion → aprobada
                         ↓
                      rechazada
```

| Estado | Badge | Descripción | Acciones disponibles |
|--------|-------|-------------|----------------------|
| `borrador` | ⚫ | En construcción | Editar, Eliminar, Avanzar |
| `enviada` | 🔵 | Enviada al cliente | Ver público, En negociación, Rechazar |
| `negociacion` | 🟡 | En proceso de ajuste | Aprobar, Rechazar |
| `aprobada` | 🟢 | Cerrada exitosamente | Ver, Duplicar |
| `rechazada` | 🔴 | No se concretó | Duplicar para revisión |

---

## Sub-proceso: Actividades

Cada registro tiene un log de actividades con su propio estado:

| Tipo | Emoji | Campos especiales |
|------|-------|-------------------|
| `llamada` | 📞 | — |
| `reunion` | 🤝 | — |
| `email` | 📧 | — |
| `visita` | 🏢 | `hora`, `lugar` |
| `tarea` | ✅ | `hecho: boolean` |
| `seguimiento` | 🔔 | `hecho: boolean` |

---

## Conexiones

- [[Pipeline_Prospectos]] — detalle del Kanban
- [[Pipeline_Cotizaciones]] — wizard 5 pasos
- [[Alertas_y_Triggers]] — qué estados generan alertas
- [[KPIs_Tiempos]] — tiempo promedio por etapa
- [[Reglas_de_Negocio]] — qué transiciones están permitidas

#estado #proceso

# Pipeline de Prospectos

> **Tipo:** Nodo de sub-proceso
> **Dependencias:** [[Estados_del_Proceso]] · [[Alertas_y_Triggers]] · [[KPIs_Tiempos]]

---

## Vista Kanban — CRM Pipeline

La página `/crm` muestra el pipeline como tablero Kanban con 6 columnas:

```
[Prospecto] [Reconocimiento] [Propuesta] [Aceptación] [Creación SOP] [Facturado]
```

### Funcionalidades
- **Drag & drop** — arrastrar tarjeta entre columnas actualiza `estadoProspecto` via `PUT /api/records/:id`
- **Alerta de seguimientos vencidos** — banner rojo si hay prospectos con `proximoSeguimiento < hoy`
- **Filtros** — por comercial y búsqueda de empresa
- **Totales** — ingresos esperados sumados por columna

### Tarjeta Kanban muestra
- Nombre empresa
- Ciudad (si existe)
- Comercial asignado
- Servicios (chips, máx 2)
- Ingresos esperados
- Próximo seguimiento (rojo si vencido)

---

## Estados excluidos del Kanban (vistas separadas)
- `frio` → aparece en tabla Prospectos con filtro de estado
- `perdido` → idem

---

## Transición a cliente

Cuando un prospecto llega a `facturado`:
1. El comercial crea un nuevo registro `tipo: "cliente"` manualmente
2. O el sistema podría automátizarlo en el futuro

---

## Conexiones

- [[Estados_del_Proceso]] — definición completa de estados
- [[Alertas_y_Triggers]] — alerta de seguimientos vencidos en Kanban
- [[KPIs_Tiempos]] — tiempo por etapa en el pipeline
- [[Actores_y_Roles]] — quién ve el Kanban

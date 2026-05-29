#modulo #seguimiento

# Calendario de Visitas

> **Tipo:** Módulo de gestión de visitas comerciales
> **Ruta:** `/calendario`
> **Dependencias:** [[Motores_de_Datos]] · [[Actores_y_Roles]] · [[KPIs_Tiempos]]

---

## Propósito

Visualiza y gestiona las visitas (actividades de tipo `visita`) en un calendario mensual. Permite al equipo comercial y a la gerencia ver la programación de visitas, marcarlas como realizadas, y navegar al detalle del cliente/prospecto.

---

## UI

### Vista Calendario
- Grid mensual (lunes como primer día)
- Cada celda muestra hasta 3 visitas (puntos verdes=pendientes, grises=realizadas)
- Click en día → DayPanel lateral con lista de visitas del día

### Vista Lista
- Grupos colapsables por día
- Muestra empresa, hora, lugar, estado (hecho/pendiente)

### DayPanel (slide-in)
- Lista detallada de visitas del día seleccionado
- Toggle `hecho` con mutación optimista
- Link a detalle del registro

### Filtros
- Por comercial (dropdown)
- Navegación de mes con ← →

---

## KPIs del mes

| Métrica | Descripción |
|---------|-------------|
| Total visitas | Actividades tipo visita en el mes |
| Realizadas | `hecho = true` |
| Pendientes | `hecho = false` |

---

## API consumida

```
GET /api/actividades?tipo=visita&mes=YYYY-MM&comercialId=xxx
```

Respuesta incluye: id, recordId, tipo, descripcion, fecha, hora, lugar, hecho, record.{id, empresa, comercialId, comercial.nombre}

---

## Campos adicionales en Actividad (visita)

- `hora`: "HH:MM" — hora de la visita
- `lugar`: dirección o lugar de la visita
- `origen`: fuente que creó la actividad (ej: "gestion-documental")

---

## Conexiones

- [[Motores_de_Datos]] — endpoint `GET /api/actividades`
- [[KPIs_Tiempos]] — visitas como indicador de actividad comercial
- [[Actores_y_Roles]] — filtro por comercial
- [[Pipeline_Prospectos]] — visitas vinculadas a registros del pipeline

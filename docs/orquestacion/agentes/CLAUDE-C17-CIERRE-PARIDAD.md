# Claude C17 — Cierre paridad HTML v6 (auditoría + specs)

**Autorizado por Cursor (orquestador) · 2026-06-22**  
**Tipo:** Solo documentación — **⛔ PROHIBIDO** tocar `frontend/`, `backend/`, Docker, `.env`.

## Comando humano

```
Ejecuta lo que tenga tu nombre — tarea C17 cierre paridad HTML.
Brief: docs/orquestacion/agentes/CLAUDE-C17-CIERRE-PARIDAD.md
```

---

## Contexto

- **C13** cerró layout Cotizaciones (lista + KPI + domainConfig).
- **C16** cerró `section-title` / KPI en Matriz, GD, Equipo, Herramientas, Calendario, SAC.
- **Cursor** corrigió Detalle (servicios, facturación, reorden) y Biblioteca (solo línea colapsable; grupos siempre visibles como HTML).
- **Codex** paró en **X9** (Detalle); **X10–X12** y **B1–B6** pendientes.
- **M8** documentó side-effects backend rotos (GD al convertir, CrmMeta, cotización→pipeline, etc.).

Los GAPs C8–C12 **existen** pero están **desactualizados** respecto al código actual. C17 los refresca y produce specs accionables para Codex/Cursor.

---

## Fuente de verdad

| Recurso | Ruta |
|---------|------|
| HTML monolito | `Ultima_versión/seguimiento-zymo-v6 (88).html` |
| GAPs actuales | `docs/orquestacion/referencia/GAP-*.md` |
| Integraciones | `docs/orquestacion/reportes/REPORTE-MINIMAX-M8-CONEXIONES.md` |
| Reportes Claude | `docs/orquestacion/reportes/REPORTE-CLAUDE-CODE.md` (C13, C16) |
| Reporte Codex | `docs/orquestacion/reportes/REPORTE-CODEX-EJECUCION.md` (X9) |
| Roadmap | `docs/orquestacion/ROADMAP-PARIDAD-HTML.md` |
| Entorno QA | http://localhost:82 · `admin_local` / `AdminLocal2026!` |

**Funciones HTML clave a inspeccionar (grep en el monolito):**

| Área | Funciones |
|------|-----------|
| Biblioteca | `renderBiblioteca`, `renderBibGrupo`, `renderBibGrupoTransporte`, `renderBibGrupoPaqueteo`, `toggleBibLinea`, `PAQUETEO_SCHEMA` |
| Cotizaciones | `renderCotizaciones`, `renderCotItemsStep`, `nuevaCotizacion`, `abrirImportarPDF` |
| Detalle | `abrirDetalle`, `page-detalle`, `buildDetBillingHTML` |
| Backend lógica | side-effects en `save()`, `convertirACliente`, flujo cotización aprobada |

---

## Entregables (obligatorios)

### 1. Actualizar GAPs abiertos

Editar **solo** lo que sigue siendo brecha real (marcar ✅ lo ya cerrado por C13/C16/Cursor):

| Archivo | Enfoque |
|---------|---------|
| `referencia/GAP-BIBLIOTECA.md` | Transporte/Paqueteo ausentes; renombrar columnas col1–3; `table-card`; obs rich; **grupos NO colapsables** (solo línea) |
| `referencia/GAP-COTIZACIONES.md` | Wizard paso 3 (tablas vs checkboxes); import PDF; CO-05 aprobar→pipeline |
| `referencia/GAP-DETALLE.md` | Panel vs `page-detalle` completo; campos editables; D-01 actualizado |
| `referencia/GAP-HERRAMIENTAS.md` | FichaDetalle profunda; export Excel matriz (MR-06) |

En cada GAP añadir sección **`## Estado post-C17`** con tabla brecha → severidad → agente (Codex/Cursor).

### 2. Crear `referencia/SPEC-BIBLIOTECA-WIZARD.md`

Especificación de implementación (para Codex **X11** + **X10**):

- **Biblioteca Transporte:** grupos local/otros, botones "+ Nuevo grupo Transporte Local/Otros", esquema fijo de columnas.
- **Biblioteca Paqueteo:** tabs COORDINADORA / TCC (o paqueteadoras del HTML), `PAQUETEO_SCHEMA`, celdas mixtas ($/%/texto), `renderBibGrupoPaqueteo`.
- **Biblioteca estándar (Zona Franca, CEDI, etc.):** confirmar UX — línea colapsable, grupos con tabla siempre visible, "+ Ítem" al pie, "🗑 Grupo", columnas extra arriba.
- **Wizard paso 3 (`renderCotItemsStep`):** árbol línea → grupo → filas con checkbox; snapshot `itemsSnapshot`; diferencias Transporte/Paqueteo vs resto.
- **Contratos API:** qué campos persisten en `BibliotecaLinea`, `BibliotecaGrupo`, `BibliotecaItem`; compatibilidad con cotizaciones existentes (106 en backup).
- **Criterios de aceptación** numerados (mín. 8) verificables en :82.

### 3. Crear `referencia/SPEC-INTEGRACION-M8.md`

Especificación backend (para Cursor **B1–B6**):

Por cada hallazgo M8 (C2–C7), documentar:

| Campo | Contenido |
|-------|-----------|
| ID | B1…B6 (mapear a C2–C7 M8) |
| Archivo(s) backend | ruta exacta |
| Comportamiento HTML | qué hacía el monolito |
| Comportamiento React actual | qué falla |
| Fix propuesto | pseudocódigo o pasos |
| Criterios de aceptación | curl o flujo manual |
| Riesgo | bajo/medio/alto |

Incluir obligatoriamente:

- GD al **convertir prospecto → cliente**
- **CrmMeta** al crear record e import masivo
- Cotización **aprobada** → `estadoProspecto` / pipeline
- Dashboard **actividad_por_comercial**
- (Opcional) endpoint duplicado actividades vencidas

### 4. Actualizar `ROADMAP-PARIDAD-HTML.md`

- Marcar ✅ módulos validados visualmente (C13/C16 + fixes Cursor).
- Dejar 🟡 los que requieren X10/X11 o backend.
- Añadir fila **Integración backend** con estado ⬜.

### 5. Entrada en `reportes/REPORTE-CLAUDE-CODE.md`

Nueva sección **## C17 — Cierre paridad (auditoría + specs)** con:

- Resumen ejecutivo (5–10 bullets)
- Lista de archivos docs tocados
- Orden recomendado: X11 → X10 → B1–B6 → L5
- **Sin** `npm run build` (no hubo código)

---

## Prioridad de análisis

1. **Biblioteca + Wizard paso 3** (gap más visible vs capturas humano)
2. **Integraciones M8** (flujo comercial roto sin backend)
3. **Detalle formulario completo** vs panel actual
4. **Pulido visual** residual (Dashboard tooltips, G-01 Barlow, CRM full-width)

---

## Criterio de Done (C17)

- [ ] 4 GAPs actualizados con sección `Estado post-C17`
- [ ] `SPEC-BIBLIOTECA-WIZARD.md` creado
- [ ] `SPEC-INTEGRACION-M8.md` creado
- [ ] `ROADMAP-PARIDAD-HTML.md` actualizado
- [ ] `REPORTE-CLAUDE-CODE.md` § C17
- [ ] **Cero** cambios en `frontend/` o `backend/`

---

## Handoff post-C17

| Siguiente | Agente | Brief |
|-----------|--------|-------|
| X11 | Codex | `SPEC-BIBLIOTECA-WIZARD.md` § Biblioteca |
| X10 | Codex | `SPEC-BIBLIOTECA-WIZARD.md` § Wizard paso 3 |
| B1–B6 | Cursor | `SPEC-INTEGRACION-M8.md` |
| L5 | Humano | `TAREAS-SPRINT.md` checklist |
| L4 | Humano pide | git commit |

---

## Anti-patrones

- No reescribir GAPs desde cero — **actualizar** con delta.
- No proponer re-arquitectura (Prisma, microservicios).
- No duplicar trabajo de C13/C16 ya cerrado en reporte.
- No asignar a Claude implementación de código en C17.

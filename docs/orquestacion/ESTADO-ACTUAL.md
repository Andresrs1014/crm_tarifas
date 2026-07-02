# Estado actual — 2026-06-22 (Cursor orquestador)

> **Docker:** http://localhost:82 · `admin_local` / `AdminLocal2026!`

## Oleada actual — paralela **sin dependencias**

| Agente | Tarea | Módulo | Estado |
|--------|-------|--------|--------|
| **Claude** | **C18 / X11** | Biblioteca (Transporte/Paqueteo) | 🟡 **ACTIVO** |
| **Cursor** | **X12** | Matriz Riesgos + Gestión Documental | 🟡 **ACTIVO** |
| — | X10 wizard paso 3 | Cotizaciones | ⏸ **después** de C18 (no paralelo) |

Brief Claude: [agentes/CLAUDE-C18-X11-BIBLIOTECA.md](./agentes/CLAUDE-C18-X11-BIBLIOTECA.md)  
Brief Cursor: [agentes/CURSOR-X12-MATRIZ-GD.md](./agentes/CURSOR-X12-MATRIZ-GD.md)

**B1–B6 backend:** ✅ cerrado (commit `2070212`, Docker backend rebuilt).

---

## Cerrado recientemente

| Oleada | Qué |
|--------|-----|
| **C16** | Matriz, GD, Equipo, Preliq, Cotizador, Fichas, Calendario, SAC — `section-title` / KPI |
| **C13** | Cotizaciones lista — KPI strip, table-header-2row, domainConfig |
| **M13** | Shell sidebar/header |
| **X9** | Detalle (Codex) — parcial según GAP |
| **Cursor** | Biblioteca: solo línea colapsable; grupos siempre visibles (HTML). Detalle servicios/reorden. Kanban. Modal tarifas. |

---

## Pendiente para “completo vs HTML”

### Visual / funcional (post-C17 → Codex)

| ID | Módulo | Brecha principal |
|----|--------|------------------|
| **X11** | Biblioteca | Transporte, Paqueteo (`PAQUETEO_SCHEMA`), renombrar columnas |
| **X10** | Cotizaciones wizard | Paso 3 = tablas HTML (`renderCotItemsStep`), import PDF |
| **X12** | Matriz + GD | Export Excel, pulido residual GAP |
| — | Detalle | Formulario completo `page-detalle` vs panel compacto |
| — | Fichas | `FichaDetalle` profundo (GAP-HERRAMIENTAS H3) |

### Backend integración (Cursor B1–B6, spec M8)

| ID | Qué |
|----|-----|
| **B2** | Convertir cliente → crear Gestión Documental |
| **B3** | Crear/import prospecto → CrmMeta (Kanban) |
| **B4** | Cotización aprobada → avanzar `estadoProspecto` |
| **B5** | Dashboard `actividad_por_comercial` |
| **B6** | Cotización ↔ record en detalle (si aplica) |

### QA humano

| ID | Qué |
|----|-----|
| **L5** | Checklist rutas en :82 (ver `TAREAS-SPRINT.md`) |
| **G-01** | Fuente body Barlow global (opcional) |
| **L4** | Git commit cuando humano pida |

---

## Próximo paso

1. **Claude:** C18/X11 Biblioteca — solo `Biblioteca.tsx` + CSS.
2. **Cursor:** X12 Matriz + GD — archivos distintos, **sin esperar a Claude**.
3. **Después (secuencial):** X10 wizard paso 3 (cuando C18 termine).
4. **Humano:** L5 QA por módulo en :82.

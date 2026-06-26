# Tareas del sprint — Fase 1 ✅ | Fase 2 ✅ | Fase 3 Codex ✅ (cierre humano)

> **Aval humano Fase 0/1:** ✅ · **Fase 2:** ✅ · **Codex Fase 3:** ✅ cerrado por humano (2026-06-22)  
> **Oleada actual:** **Minimax M9** · **Cursor L5** · backlog X10–X12 + B1–B6

---

## Estado por agente

| Agente | Entregado | Siguiente (autorizado) |
|--------|-----------|------------------------|
| **Claude** | C1–C12 | ✅ **Cerrado** |
| **Codex** | X1–X4, X6, **X9** | ✅ **Cerrado** — backlog abajo |
| **Minimax** | M4, **M8** ✅, **M9** observaciones ✅ | M5 Equipo cuando humano quiera |
| **Cursor** | L1–L3, L7, X7, X8b, Kanban, Detalle layout | **L5** QA · I1 · **L4** commit si humano pide |

---

## Fase 0 + Fase 1 — ✅ CERRADA

| ID | Tarea | Estado |
|----|-------|--------|
| X1–X4 | Design system + Dashboard + Registro | ✅ |
| L2 | Integración + hover charts G-27–30 | ✅ |
| G-31 | Eje Y Pipeline (labels 12px, width 164px) | ✅ |
| Regla | `.cursor/rules/06-no-hardcode.mdc` | ✅ |
| Aval | Humano revisó :82 | ✅ |

---

## Fase 2 — EN CURSO (orden estricto)

### 1️⃣ Claude Code — GAP (solo docs, **ahora**)

Comando: `Ejecuta lo que tenga tu nombre`

| ID | Módulo | Entregable | React actual |
|----|--------|------------|--------------|
| **C5** ✅ | Prospectos | `referencia/GAP-PROSPECTOS.md` | `pages/Prospectos.tsx` |
| **C6** ✅ | CRM Pipeline | `referencia/GAP-CRM.md` | `pages/CRMKanban.tsx` |
| **C7** ✅ | Clientes | `referencia/GAP-CLIENTES.md` | `pages/Clientes.tsx` |

Incluir en cada GAP: clases HTML, layout, filtros, tablas, anti-hardcode (qué mover a `constants.ts`).

### 2️⃣ Codex — Implementación visual (tras GAP aprobado)

Comando: `Ejecuta lo que tenga tu nombre`

| ID | Módulo | Brief | Depende |
|----|--------|-------|---------|
| **X6** | Prospectos | idem + GAP-PROSPECTOS | C5 ✅ · **Codex** ✅ |
| **X7** | CRM Kanban | idem + GAP-CRM | C6 ✅ · **Cursor** ✅ |
| **X8b** | Clientes | idem + GAP-CLIENTES | C7 ✅ · **Cursor** ✅ |
| **X8** | Recharts en otros módulos | `chartTheme.ts` compartido | Paralelo |

**X6 checklist rápido (anticipado):**
- `section-title`, `table-card`, `filter-select`, `filter-input`, `stag`
- Pipeline bar → clases/CSS HTML (no `card` Tailwind genérico)
- Estados → `PIPELINE_*` desde `htmlV6/constants.ts` (no duplicar arrays)
- Quitar `p-6` doble si `.main` ya tiene padding

### 3️⃣ Minimax — M8 ✅ completado

| ID | Entregable | Estado |
|----|------------|--------|
| **M8** | `reportes/REPORTE-MINIMAX-M8-CONEXIONES.md` | ✅ |

| ID | Cuándo (después de M8) |
|----|------------------------|
| M5 Equipo | Tras aval humano Fase 2 |
| M6 Calendario | Tras M5 |
| M7 SAC | Tras M6 |

### 4️⃣ Minimax — M9 Detalle observaciones (AUTORIZADO · ahora)

| ID | Tarea | Brief | Estado |
|----|-------|-------|--------|
| **M9** | Edición inline observaciones en `/detalle/:id` | `agentes/MINIMAX-M9-DETALLE-OBSERVACIONES.md` | ✅ |

Comando Minimax:
```
Ejecuta lo que tenga tu nombre — tarea M9 observaciones en Detalle.
```

---

> **Gate humano:** Codex cerrado. Cursor **desbloqueado** para L5, I1, consolidación.

### Backlog post-Fase 3 (sin agente asignado aún)

| ID | Tarea | Notas |
|----|-------|-------|
| **X10** | Cotizaciones + wizard | GAP C9 listo |
| **X11** | Biblioteca | GAP C10 |
| **X12** | Matriz + GD UI | GAP C11 |
| **X8** | chartTheme Recharts | Paralelo |
| **B1–B6** | Backend integración M8 | Ver `REPORTE-MINIMAX-M8` §13 |

**@CURSOR — integración (líder):**

| ID | Tarea | Cuándo |
|----|-------|--------|
| **L5** | Aval / QA integración en :82 | **Ahora** |
| **I1** | Unificar CRM `estadoProspecto` vs `CrmMeta` | Tras L5 o en paralelo |
| **I2** | Aval humano: conversión in-place vs nuevo registro | Humano |
| **I3** | Kanban drag fix | ✅ |
| **L4** | Git commit | Cuando humano pida |

**Nota líder:** MiniMax C1 (endpoint duplicado) es **falso positivo** — rutas distintas: `/api/actividades/vencidas` vs `/api/crm/actividades/vencidas`.

### 4️⃣ Cursor líder

| ID | Tarea | Cuándo |
|----|-------|--------|
| L5 | QA integración X6–X9 + CRM + Clientes en :82 | **Ahora** |
| L4 | Git commit Fase 0–3 + orquestación | Cuando humano pida |
| L7 | Auditoría anti-hardcode | ✅ |

---

## Comandos para pegar en cada agente

**Claude — cerrado Fase 3:**
```
C8–C12 GAP entregados en referencia/. Sin tareas hasta nuevo sprint.
```

**Codex — cerrado:**
```
Fase 3 cerrada por humano. Entregables: X1–X4, X6, X9. Ver REPORTE-CODEX-EJECUCION.md.
Backlog X10–X12 + B1–B6 → TAREAS-SPRINT § backlog.
```

**Cursor — activo:**
```
L5 QA :82 · M9 en paralelo con Minimax · I1/I2 según aval humano.
```

---

## Aval Fase 2

- [x] Humano revisó GAP C5–C7 ← **listo para revisión**
- [x] OK X6 Prospectos (**Codex** — reporte + captura)
- [x] OK X7 CRM (**Cursor**)
- [x] OK X8b Clientes (**Cursor**)
- [ ] **L5** Aval humano Fase 2 en :82

---

## Fase 3 — GAP Claude ✅ · Codex X9 ✅ · backlog X10–X12 + B1–B6

> Briefs: `agentes/CLAUDE-FASE3-GAP.md` · `agentes/CODEX-FASE3-EJECUCION.md`

### 5️⃣ Claude Code — GAP Fase 3 ✅ CERRADA

| ID | Módulo | Entregable | Estado |
|----|--------|------------|--------|
| **C8** | Detalle | `GAP-DETALLE.md` | ✅ |
| **C9** | Cotizaciones | `GAP-COTIZACIONES.md` | ✅ |
| **C10** | Biblioteca | `GAP-BIBLIOTECA.md` | ✅ |
| **C11** | Matriz + Gestión Doc | `GAP-MATRIZ-RIESGOS.md` + `GAP-GESTION-DOCUMENTAL.md` | ✅ |
| **C12** | Herramientas | `GAP-HERRAMIENTAS.md` | ✅ |

### 6️⃣ Codex — ✅ CERRADO (cierre humano 2026-06-22)

Entregado: **X1–X4**, **X6**, **X9**. Reporte: `reportes/REPORTE-CODEX-EJECUCION.md`.

| ID | Módulo | Estado |
|----|--------|--------|
| **X9** | Detalle | ✅ |
| **X10** | Cotizaciones | ⬜ Backlog |
| **X11** | Biblioteca | ⬜ Backlog |
| **X12** | Matriz + GD | ⬜ Backlog |
| **B1–B6** | Backend M8 | ⬜ Backlog |
| **X8** | chartTheme | ⬜ Backlog |

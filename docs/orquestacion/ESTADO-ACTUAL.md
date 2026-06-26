# Estado actual — 2026-06-22 (Cursor líder)

> **Checkpoint git:** `b536760` — sprint paridad HTML v6 + orquestación guardado en `soylabumba`.  
> **Próxima sesión:** enfoque de trabajo a definir con el humano (fin modelo multi-agente distribuido).

## Fase del flujo

| Paso | Estado |
|------|--------|
| Fase 0–1 Dashboard + Registro | ✅ Aval humano OK |
| Fase 2 (C5–C7 GAP + X6/X7/X8b) | ✅ |
| Claude C8–C12 (GAP Fase 3) | ✅ |
| **Codex Fase 3 (ciclo humano)** | ✅ **Cerrado** — entregó X1–X4, X6, **X9** |
| Cursor hotfixes (Kanban, Detalle layout) | ✅ |
| Minimax M8 + **M9** observaciones | ✅ |
| **L5 aval humano ampliado** | ⬜ Pendiente revisión :82 |
| **Backlog post-Fase 3** | X10–X12 · B1–B6 (ver abajo) |

## Quién hace qué ahora

| Agente | Estado |
|--------|--------|
| **Codex** | ✅ **Cerrado** este sprint (reporte `REPORTE-CODEX-EJECUCION.md`) |
| **Claude** | ✅ Cerrado (C1–C12) |
| **Minimax** | ✅ M8 + **M9** cerrados |
| **Cursor** | **Activo** — L5 QA · consolidar · I1/I2 cuando aplique · L4 commit si pides |

## Codex — entregado vs backlog

**Entregado (verificado en repo + reporte):**

| ID | Módulo |
|----|--------|
| X1–X4 | Design system, shell, Dashboard, Registro |
| X6 | Prospectos HTML v6 |
| X9 | Detalle GAP D-01–D-07, constantes centralizadas |

**Backlog (no en reporte / no en código aún):**

| ID | Tarea |
|----|-------|
| X10 | Cotizaciones + wizard |
| X11 | Biblioteca |
| X12 | Matriz + Gestión documental UI |
| X8 | chartTheme otros módulos |
| B1 | `convertProspectToCliente` → `getOrCreateGD` |
| B2 | Cotización aprobada → avanzar pipeline |
| B3 | Import Excel transaccional |
| B4 | Dashboard `actividad_por_comercial` |
| B5 | CORS prod sin `*` |
| B6 | `getCotizacionById` include record |

## Docker local

- http://localhost:82 · `admin_local` / `AdminLocal2026!`

## Próximo paso (Cursor + humano)

1. **Humano:** revisar :82 (Detalle, Prospectos, CRM Kanban, Clientes)
2. **Minimax M9** ✅ — observaciones inline en Detalle
3. **Cursor:** L5 checklist · decidir backlog X10–B6
4. **L4 commit** cuando pidas

# Claude C13 — Cotizaciones paridad HTML v6

**Independiente** — no esperes a MiniMax ni a Cursor (excepto merge final).

## Objetivo

Dejar **Cotizaciones** (lista + wizard + acciones) visualmente igual al HTML v6.

## Fuente de verdad

- HTML: `Ultima_versión/seguimiento-zymo-v6 (88).html` → `page-cotizaciones`, wizard, modal tarifas
- GAP: `docs/orquestacion/referencia/GAP-COTIZACIONES.md`
- CSS: `frontend/src/styles/html-v6.css`
- Config: `frontend/src/lib/htmlV6/domainConfig.ts`, `constants.ts`

## Archivos (solo estos)

| Archivo | Qué |
|---------|-----|
| `frontend/src/pages/Cotizaciones.tsx` | Lista, filtros, KPI strip, table-card, acciones |
| `frontend/src/pages/wizard/*` | Wizard 5 pasos — clases HTML |
| `frontend/src/pages/CotPublica.tsx` | Solo si el GAP lo marca (mínimo) |
| `frontend/src/styles/html-v6.css` | Solo reglas `.cot-*` / compartidas si faltan |

**No tocar:** Biblioteca, Equipo, Matriz, Detalle, Kanban, Docker.

## Checklist GAP (prioridad 🔴)

- [ ] `section-title` en lugar de `h1 text-2xl font-bold`
- [ ] Estructura `table-card` + `table-header-2row` (título + filtros dentro del card)
- [ ] KPI strip (total, aprobadas, enviadas, rechazadas) con estilo HTML
- [ ] Botón **"+ Nueva Cotización"** (texto completo)
- [ ] Wizard pasos: clases `form-grid`, `btn-primary`, badges `stag`
- [ ] Modal Actualizar Tarifas: clases HTML consistentes

## Funcional

- **No romper** flujos existentes (API, mutaciones, wizard, PDF, link público).
- Build debe pasar: `npm run build` en `frontend/`.

## Entregable

Actualizar `docs/orquestacion/reportes/REPORTE-CLAUDE-CODE.md` § C13 con:
- Qué cambió
- Capturas o checklist vs GAP
- Archivos tocados

## Comando humano

```
Ejecuta lo que tenga tu nombre — tarea C13 Cotizaciones.
```

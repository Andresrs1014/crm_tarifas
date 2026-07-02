# MiniMax M10 — Biblioteca paridad HTML v6

**Independiente** — no esperes a Claude ni a Cursor (excepto merge final).

## Objetivo

Dejar **Biblioteca de Tarifas** visualmente igual al HTML v6.

## Fuente de verdad

- HTML: `page-biblioteca` en `Ultima_versión/seguimiento-zymo-v6 (88).html`
- GAP: `docs/orquestacion/referencia/GAP-BIBLIOTECA.md`
- CSS: `frontend/src/styles/html-v6.css`

## Archivos (solo estos)

| Archivo | Qué |
|---------|-----|
| `frontend/src/pages/Biblioteca.tsx` | Layout, cards, árbol líneas/grupos/items |
| `frontend/src/styles/html-v6.css` | Solo reglas biblioteca si faltan |

**No tocar:** Cotizaciones, wizard, Equipo, backend, Docker, `.env`.

## Checklist GAP (prioridad 🔴/🟡)

- [ ] `section-title` en header
- [ ] Cards de línea → `table-card` (no `card` Tailwind genérico)
- [ ] Filtros/inputs → `filter-input` donde aplique
- [ ] Botón **"+ Línea"** alineado al HTML
- [ ] Hover/acciones consistentes con otros módulos v6

## Funcional

- **No romper** CRUD inline, columnas extra, observaciones, mutaciones API.
- Build: `npm run build` en `frontend/`.

## Entregable

Actualizar `docs/orquestacion/reportes/REPORTE-MINIMAX.md` § M10.

## Comando humano

```
Ejecuta lo que tenga tu nombre — tarea M10 Biblioteca.
```

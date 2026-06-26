# CODEX — Implementación precisa

## Comandos del humano

| Fase | Comando | Qué haces |
|------|---------|-----------|
| **A — Reconocimiento** | `lee en docs/orquestacion/` | Auditar build/CSS/layout; escribir reporte; **sin código** |
| **C — Ejecución** | `Ejecuta lo que tenga tu nombre` | Solo tareas aprobadas en TAREAS-SPRINT.md |

---

## Fase A — Reconocimiento (AHORA)

1. Lee `docs/orquestacion/PROMPT-INICIO.md` y documentos enlazados
2. Revisa en repo:
   - `frontend/src/index.css`, `Layout.tsx`, `tailwind.config.js`
   - `docker compose config` / intenta build si el humano lo permite
3. Escribe **`docs/orquestacion/reportes/REPORTE-CODEX.md`**

### En tu reporte incluye

- ¿`npm run build` / `docker compose build frontend` pasa o falla?
- Lista concreta de clases CSS del HTML que faltan en React
- Layout: diferencias medidas (sidebar, header, padding, max-width)
- Propuesta de tareas **para ti** (port CSS, layout, fixes build)

4. **Para.** No implementes aún

---

## Fase C — Ejecución (después del aval)

### ✅ Fase 0 completada (X1–X4)

Ver [REPORTE-CODEX-EJECUCION.md](../reportes/REPORTE-CODEX-EJECUCION.md).

### ✅ Fase 2 completada (X6)

Ver [REPORTE-CODEX-EJECUCION.md](../reportes/REPORTE-CODEX-EJECUCION.md). X7/X8b los hizo Cursor.

### 🟡 Fase 3 — X9 ✅ · X10–X12 backlog

| ID | Tarea | Estado |
|----|-------|--------|
| **X9** | Detalle — paridad HTML v6 | ✅ |
| **X10** | Cotizaciones (+ wizard) | ⬜ Backlog |
| **X11** | Biblioteca Tarifas | ⬜ Backlog |
| **X12** | Matriz Riesgos + Gestión Documental | ⬜ Backlog |
| **X8** | chartTheme en otros módulos Recharts | ⬜ Backlog |
| **B1–B6** | Backend integración post-M8 | ⬜ Backlog |

**Brief:** [CODEX-FASE3-EJECUCION.md](./CODEX-FASE3-EJECUCION.md) + GAP del módulo + **06-no-hardcode.mdc**.

**Regla:** No iniciar X9 hasta existir `GAP-DETALLE.md`.

Tareas históricas Fase 0:

- `frontend/src/styles/html-v6.css` ✅
- Layout 200px / 60px ✅
- Dashboard + Registro clases HTML ✅

---

## Rol

Precisión en CSS, TypeScript, Docker. Módulos de negocio grandes → @CLAUDE.

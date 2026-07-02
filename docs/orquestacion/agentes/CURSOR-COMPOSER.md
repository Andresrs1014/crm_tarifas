# CURSOR COMPOSER — LÍDER

## Comandos del humano

| Fase | Comando | Qué haces |
|------|---------|-----------|
| **A — Reconocimiento** | `lee en docs/orquestacion/` | Explorar repo + Docker en este PC; escribir reporte |
| **B — Consolidar** | `Consolida los reportes y propón TAREAS-SPRINT` | Leer 4 reportes; redactar tareas; esperar aval |
| **C — Ejecución** | `Ejecuta lo que tenga tu nombre` | Implementar solo lo aprobado en TAREAS-SPRINT.md |

---

## Fase A — Reconocimiento (AHORA si te lo piden)

1. Lee `docs/orquestacion/PROMPT-INICIO.md` y el resto de la carpeta
2. En **este equipo**:
   - `Copy-Item .env.docker.local .env` (si falta `.env`)
   - `docker compose up --build -d`
   - Revisa logs y http://localhost:82
3. Escribe **`docs/orquestacion/reportes/REPORTE-CURSOR-COMPOSER.md`** (usa plantilla)
4. **Para.** No asignes tareas aún; no implementes paridad visual aún

### En tu reporte incluye

- Estado Docker (build OK / errores)
- Estado repo (rama, commits recientes)
- Resumen de brecha HTML vs React (alto nivel)
- Borrador de cómo repartirías trabajo entre los 4 agentes

---

## Fase B — Consolidación (cuando humano vuelve)

1. Lee los 4 archivos en `docs/orquestacion/reportes/REPORTE-*.md`
2. Completa **`docs/orquestacion/TAREAS-SPRINT.md`** con tareas concretas e IDs
3. Actualiza **`docs/orquestacion/ESTADO-ACTUAL.md`**
4. Presenta al humano para **aval**
5. Copia tareas relevantes a cada `agentes/*.md` sección "Tareas ACTIVAS"

---

## Fase C — Ejecución (tras aval)

Solo tareas marcadas en `TAREAS-SPRINT.md` con aval ✅.

Rol habitual del líder en ejecución:

- Integrar cambios de otros agentes
- Dashboard / Registro / Layout
- Verificar Docker + agent browser
- Commits cuando el humano lo pida

---

## Feedback del humano tras revisión — DELEGAR, no absorber

Cuando el humano revise en `:82` (o capturas) y pida cambios:

1. **No implementar todo solo.** Primero **clasificar** cada punto de feedback.
2. **Entregar un plan repartido** antes de tocar código (salvo hotfix P0 acordado explícitamente).

### Matriz de reparto (default)

| Tipo de cambio | Agente | Ejemplo |
|----------------|--------|---------|
| GAP / análisis HTML vs React (solo docs) | **Claude** | Nueva brecha visual, flujo funcional mal documentado |
| Implementación CSS/layout por módulo | **Codex** | `section-title`, `table-card`, paridad página X |
| Mapa conexiones, auditoría integración | **Minimax** | ¿Módulo A llama bien al B? (solo investigación) |
| Integración, backend, Kanban complejo, orquestación | **Cursor** | API rota, merge entre agentes, `TAREAS-SPRINT.md` |
| Equipo, Calendario, SAC (estética/config pequeña) | **Minimax** | M5–M7 cuando aplique |

### Formato de respuesta al humano

Presentar siempre:

1. **Lista de cambios identificados** (numerada, con módulo y severidad)
2. **Tareas propuestas por agente** (ID, entregable, comando para pegar en su chat)
3. **Qué hará Cursor** (solo lo mínimo: integración, bloqueos, L5/L4)
4. **Qué queda en espera** de aval o de GAP previo

Actualizar `TAREAS-SPRINT.md` y, si aplica, brief en `agentes/*.md`.

**Excepción:** fix de 1–3 líneas claramente de integración/líder (ruta rota, import, typo que rompe build) — Cursor puede hacerlo y **documentar** que no absorbió el resto del feedback.

---

## No hacer en Fase A

- No modificar código de paridad visual
- No commitear
- No asignar tareas finales sin leer los otros 3 reportes

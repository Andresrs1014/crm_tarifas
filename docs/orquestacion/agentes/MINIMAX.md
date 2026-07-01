# MINIMAX — Tareas pequeñas

## Docker — PROHIBIDO para Minimax

**No ejecutes** `docker compose`, **no edites** `docker-compose.yml`, `.env`, `Dockerfile`, `.env.docker.local`.

Si necesitas verificar algo en contenedor → documenta en reporte y pide @CODEX o @CLAUDE.

---

## Comandos del humano

| Fase | Comando | Qué haces |
|------|---------|-----------|
| **A — Reconocimiento** | `lee en docs/orquestacion/` | Revisión rápida; escribir reporte; **sin código** |
| **C — Ejecución** | `Ejecuta lo que tenga tu nombre` | Solo tareas aprobadas en TAREAS-SPRINT.md |

---

## Fase A — Reconocimiento (AHORA)

1. Lee `docs/orquestacion/PROMPT-INICIO.md` y documentos enlazados
2. Paseo rápido: `index.html` (fuentes), `docker-compose.yml`, `tailwind.config.js`, warnings obvios
3. Escribe **`docs/orquestacion/reportes/REPORTE-MINIMAX.md`**

### En tu reporte incluye

- Quick wins detectados (< 30 min c/u)
- Cosas ya hechas vs pendientes (ej. fuentes Barlow, cyan tailwind)
- Propuesta de 3–5 tareas pequeñas **para ti**

4. **Para.** No implementes aún

---

## Fase C — Ejecución (después del aval)

Tareas típicas: fuentes, `.env.example`, limpieza compose, fixes puntuales, actualizar ESTADO-ACTUAL.

Si crece → escala a @CODEX en el reporte.

---

## M8 — Mapa de conexiones (AUTORIZADO · solo investigación)

**Brief:** `docs/orquestacion/agentes/MINIMAX-M8-MAPA-CONEXIONES.md`

Investigar cómo se conectan **todos** los módulos (UI, API, DB, side-effects). Entregar reporte extenso. **No cambiar nada del repo** excepto el archivo de reporte.

Comando humano:
```
Ejecuta M8 — SOLO INVESTIGACIÓN, sin tocar código.
```

---

## M9 — Observaciones editables en Detalle (AUTORIZADO · implementación)

**Brief:** `docs/orquestacion/agentes/MINIMAX-M9-DETALLE-OBSERVACIONES.md`

Permitir editar y guardar **observaciones** inline en `/detalle/:id` sin activar el modo "Editar" global del header.

**Estado:** ✅ Completado — ver `reportes/REPORTE-MINIMAX.md` § M9.

---

## Regla

Un problema = un cambio pequeño. No refactorizar módulos enteros.

---

## Metodología v2 (2026-06-22)

Orquestación **Claude + MiniMax** en paralelo. Ver [METODOLOGIA-V2.md](../METODOLOGIA-V2.md).

### Tarea activa — M13 Shell (paridad HTML v6)

**Brief:** [MINIMAX-M13-SHELL-PARIDAD.md](./MINIMAX-M13-SHELL-PARIDAD.md)  
**GAP:** `referencia/GAP-DASHBOARD-REGISTRO.md` (G-02, G-03, G-13)  
Header 60px · Sidebar 200px · nav Barlow Condensed. **Paralelo a Claude C16** — no tocar páginas de módulos.

Comando:
```
Ejecuta lo que tenga tu nombre — tarea M13 Shell paridad HTML v6.
```

### Histórico — M10 Biblioteca ✅

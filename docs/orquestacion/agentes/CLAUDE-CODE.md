# CLAUDE CODE — Análisis y módulos grandes

## Comandos del humano

| Fase | Comando | Qué haces |
|------|---------|-----------|
| **A — Reconocimiento** | `lee en docs/orquestacion/` | Analizar HTML; escribir reporte; **sin código** |
| **C — Ejecución** | `Ejecuta lo que tenga tu nombre` | Solo tareas aprobadas en TAREAS-SPRINT.md |

---

## Fase A — Reconocimiento (AHORA)

1. Lee `docs/orquestacion/PROMPT-INICIO.md` y documentos enlazados
2. Abre / analiza `Ultima_versión/seguimiento-zymo-v6 (88).html` y `docs/_html-extract/`
3. Opcional: compara mentalmente con http://localhost:82 si Docker está arriba
4. Escribe **`docs/orquestacion/reportes/REPORTE-CLAUDE-CODE.md`**

### En tu reporte incluye

- Mapa de módulos HTML (15 del sidebar)
- CSS: qué bloques hay que portar (stat-card, form-grid, etc.)
- Gap visual Dashboard + Registro (HTML vs React)
- Gap funcional (funciones JS vs API actual)
- Propuesta de tareas **para ti** y sugerencias para @CODEX / @CURSOR

5. **Para.** No crees archivos en `frontend/` aún

---

## Fase C — Ejecución (después del aval)

### ✅ Fase 0 completada

- C1 CSS extract, C2 GAP Dashboard/Registro, C4 QA visual

### ✅ Fase 2 completada

- C5–C7 GAP Prospectos, CRM, Clientes ✅

### ✅ Fase 3 completada (C8–C12)

| ID | Entregable | Estado |
|----|------------|--------|
| C8 | `GAP-DETALLE.md` | ✅ |
| C9 | `GAP-COTIZACIONES.md` | ✅ |
| C10 | `GAP-BIBLIOTECA.md` | ✅ |
| C11 | `GAP-MATRIZ-RIESGOS.md` + `GAP-GESTION-DOCUMENTAL.md` | ✅ |
| C12 | `GAP-HERRAMIENTAS.md` | ✅ |

**Claude cerrado** hasta nuevo sprint. Codex implementa X9–X12.

Tareas históricas Fase 0:

- Extraer CSS a `docs/orquestacion/referencia/html-v6-styles.css` ✅
- Documentos GAP por módulo (Dashboard/Registro) ✅

---

## Rol

Análisis profundo, arquitectura, módulos complejos. No tareas de una línea → @MINIMAX.

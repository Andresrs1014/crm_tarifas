# Orquestación — CRM Paridad HTML v6

Todo en **este equipo**: Docker local, agent browser, logs en terminal. Sin trabajo en infra remota.

---

## Empezar aquí

### Prompt único para Claude, Codex y Minimax

Copiar bloque de **[PROMPT-GENERAL-AGENTES.md](./PROMPT-GENERAL-AGENTES.md)** en cada chat.

Luego el humano dice: `lee en docs/orquestacion/`

### Paso 1 — Reconocimiento (4 agentes)

En **cada** chat (Cursor, Claude Code, Codex, Minimax) di:

```
lee en docs/orquestacion/
```

Cada agente lee [PROMPT-INICIO.md](./PROMPT-INICIO.md), explora según su rol y escribe su informe en:

`docs/orquestacion/reportes/REPORTE-<AGENTE>.md`

**Nadie implementa código en esta fase.**

### Paso 2 — Consolidación (solo Cursor líder)

Vuelves a **este chat (Cursor)** y dices:

```
Consolida los reportes y propón TAREAS-SPRINT
```

El líder lee los 4 reportes y completa [TAREAS-SPRINT.md](./TAREAS-SPRINT.md). Tú das **aval**.

### Paso 3 — Ejecución (4 agentes, uno por uno)

En cada chat:

```
Ejecuta lo que tenga tu nombre
```

Solo entonces implementan lo asignado en `TAREAS-SPRINT.md` y su archivo en `agentes/`.

---

## Documentos

| Archivo | Para qué |
|---------|----------|
| **[PROMPT-GENERAL-AGENTES.md](./PROMPT-GENERAL-AGENTES.md)** | **Prompt único Claude + Codex + Minimax** |
| **[SKILLS-OBLIGATORIAS.md](./SKILLS-OBLIGATORIAS.md)** | Skills que todos deben leer |
| [PROMPT-INICIO.md](./PROMPT-INICIO.md) | Variante / índice de prompts |
| [VISION-CRM.md](./VISION-CRM.md) | Qué es el CRM |
| [REGLAS-EQUIPO.md](./REGLAS-EQUIPO.md) | Reglas compartidas |
| [DOCKER-EQUIPO-LOCAL.md](./DOCKER-EQUIPO-LOCAL.md) | Docker en tu PC + browser + logs |
| [TAREAS-SPRINT.md](./TAREAS-SPRINT.md) | Tareas oficiales (líder + aval) |
| [ESTADO-ACTUAL.md](./ESTADO-ACTUAL.md) | Bitácora |
| [ROADMAP-PARIDAD-HTML.md](./ROADMAP-PARIDAD-HTML.md) | Orden de módulos |
| [agentes/](./agentes/) | Rol y tareas por agente |
| [reportes/](./reportes/) | Informes de reconocimiento |

---

## Equipo

```
         Humano (aval)
              │
    ┌─────────▼─────────┐
    │  CURSOR — LÍDER   │  ← consolidas aquí
    └─────────┬─────────┘
  ┌───────────┼───────────┐
  ▼           ▼           ▼
CLAUDE      CODEX      MINIMAX
(análisis)  (precisión) (pequeño)
```

## Regla de oro

**HTML v6 manda** — visual y funcional. No inventar UI.

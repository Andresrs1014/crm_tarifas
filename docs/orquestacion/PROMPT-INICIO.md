# Prompt de inicio — pegar en cada agente

Cuando el humano diga:

```
lee en docs/orquestacion/
```

**Copia y pega el bloque correspondiente a tu herramienta** (o el genérico si aplica).

---

## Bloque genérico (cualquier agente)

```
Estás en el proyecto CRM Tarifas (reinicio paridad HTML v6). TODO ocurre en ESTE equipo Windows — Docker local, agent browser, logs en terminal. No hay servidor remoto en este trabajo.

PASO 1 — Lee en este orden:
1. docs/orquestacion/PROMPT-INICIO.md (este archivo)
2. docs/orquestacion/README.md
3. docs/orquestacion/VISION-CRM.md
4. docs/orquestacion/REGLAS-EQUIPO.md
5. docs/orquestacion/DOCKER-EQUIPO-LOCAL.md
6. docs/orquestacion/agentes/<TU-ARCHIVO>.md  (identifica cuál es el tuyo abajo)

PASO 2 — FASE RECONOCIMIENTO (solo ahora; NO implementes código aún):
- Explora lo que corresponda a tu rol (HTML, repo, Docker, frontend, backend).
- Si puedes: levanta o verifica Docker (`cp .env.docker.local .env` + `docker compose up --build -d`).
- Si tienes browser: abre http://localhost:82 y compara con el HTML de referencia en `Ultima_versión/`.

PASO 3 — Escribe tu informe en:
docs/orquestacion/reportes/REPORTE-<TU-NOMBRE>.md

Usa la plantilla en docs/orquestacion/reportes/PLANTILLA-REPORTE.md

PASO 4 — Para aquí. No sigas con cambios en el repo.
El humano volverá al LÍDER (Cursor Composer), quien leerá todos los reportes, propondrá tareas en docs/orquestacion/TAREAS-SPRINT.md, y el humano dará aval.

PASO 5 — Solo después, el humano dirá en cada chat:
"Ejecuta lo que tenga tu nombre"
y entonces sí implementas lo que figure en tu archivo de agente o en TAREAS-SPRINT.md.
```

---

## ¿Cuál es mi archivo?

| Herramienta | Archivo agente | Informe |
|-------------|----------------|---------|
| **Cursor Composer** (líder) | `agentes/CURSOR-COMPOSER.md` | `reportes/REPORTE-CURSOR-COMPOSER.md` |
| **Claude Code** | `agentes/CLAUDE-CODE.md` | `reportes/REPORTE-CLAUDE-CODE.md` |
| **Codex** | `agentes/CODEX.md` | `reportes/REPORTE-CODEX.md` |
| **Minimax** | `agentes/MINIMAX.md` | `reportes/REPORTE-MINIMAX.md` |

---

## Bloque solo para Cursor (líder) — fase reconocimiento

```
lee en docs/orquestacion/

Eres el LÍDER. Fase reconocimiento:
1. Lee toda la carpeta docs/orquestacion/
2. Verifica Docker en ESTE equipo: .env desde .env.docker.local, docker compose up --build -d, logs, http://localhost:82
3. Escribe docs/orquestacion/reportes/REPORTE-CURSOR-COMPOSER.md

Cuando el humano vuelva contigo después de los otros 3 reportes:
- Lee reportes/REPORTE-*.md
- Redacta docs/orquestacion/TAREAS-SPRINT.md con tareas concretas por agente
- Espera aval del humano antes de que nadie ejecute
```

---

## Recordatorio humano (flujo completo)

```
1. Abrir 4 chats → en cada uno: "lee en docs/orquestacion/"
2. Esperar 4 informes en docs/orquestacion/reportes/
3. Volver a Cursor (líder) → "Consolida reportes y propón TAREAS-SPRINT"
4. Dar aval al líder
5. Ir chat por chat → "Ejecuta lo que tenga tu nombre"
```

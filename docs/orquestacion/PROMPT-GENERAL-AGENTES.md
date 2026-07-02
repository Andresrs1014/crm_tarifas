# Prompt general — Claude Code, Codex y Minimax

**Copia y pega este bloque completo** en cada uno de los 3 chats (Claude, Codex, Minimax).

El humano dirá después: `lee en docs/orquestacion/` — este prompt ya incluye ese contexto.

---

```
═══════════════════════════════════════════════════════════════════
CRM TARIFAS ZYMO — REINICIO PARIDAD HTML v6
Agente: [CLAUDE CODE | CODEX | MINIMAX — identifícate al escribir el reporte]
Equipo: SOLO este PC Windows. Docker local. Agent browser. Logs en terminal.
═══════════════════════════════════════════════════════════════════

▌ OBJETIVO ÚNICO (importancia suprema)
Copiar a la PERFECCIÓN el monolito HTML de referencia:
  Ultima_versión/seguimiento-zymo-v6 (88).html
— misma visualización, mismos flujos, misma funcionalidad al 100%.
El React/Node actual NO es la referencia. El HTML SÍ.

▌ REGLAS GLOBALES — SKILLS (OBLIGATORIO, NO SALTAR)
Antes de hacer NADA, lee y aplica TODAS las skills aplicables a tu rol:
  docs/orquestacion/SKILLS-OBLIGATORIAS.md
Incluye como mínimo: .cursorrules, ponytail/YAGNI, workflow, code-review,
security, frontend-design, web-design-guidelines, y las de tu dominio.
Si no leíste las skills → PARA y léelas primero.

▌ ORQUESTACIÓN — QUÉ HACER AHORA (FASE 1: RECONOCIMIENTO)
NO implementes código todavía. Solo reconoce y documenta.

PASO 1 — Lee en orden:
  1. docs/orquestacion/PROMPT-GENERAL-AGENTES.md (este archivo)
  2. docs/orquestacion/SKILLS-OBLIGATORIAS.md  ← skills obligatorias
  3. docs/orquestacion/README.md
  4. docs/orquestacion/VISION-CRM.md
  5. docs/orquestacion/REGLAS-EQUIPO.md
  6. docs/orquestacion/agentes/<TU-ARCHIVO>.md
     • Claude Code → CLAUDE-CODE.md
     • Codex       → CODEX.md
     • Minimax     → MINIMAX.md

PASO 2 — Explora según tu rol:
  • HTML referencia + docs/_html-extract/ + docs/_html-analysis.json
  • Repo frontend/backend relevante a tu rol
  • Docker SOLO si tu agente está autorizado (ver abajo)
  • Browser: http://localhost:82 vs HTML local (si Docker está arriba)

PASO 3 — Escribe TU informe (obligatorio):
  docs/orquestacion/reportes/REPORTE-<TU-NOMBRE>.md
  Usa plantilla: docs/orquestacion/reportes/PLANTILLA-REPORTE.md

  En el informe incluye:
  - Qué skills leíste (lista)
  - Hallazgos visual + funcional (brecha HTML vs React)
  - Propuesta de tareas para ti
  - Riesgos / bloqueos

PASO 4 — PARA. El humano vuelve al LÍDER (Cursor Composer).
  Cursor consolidará TAREAS-SPRINT.md → humano da aval →
  entonces el humano dirá: "Ejecuta lo que tenga tu nombre"

▌ DOCKER — QUIÉN PUEDE TOCARLO
  ✅ Claude Code — sí
  ✅ Codex       — sí
  ✅ Cursor      — sí (líder)
  ❌ Minimax     — PROHIBIDO tocar Docker, docker-compose, .env, Dockerfiles
  Minimax: solo código/docs pequeños fuera de contenedores.

▌ REVISAR TRABAJO DE OTRO AGENTE
  • NO edites archivos que otro agente cambió para "arreglarlos"
  • SÍ documenta objeciones en tu reporte o en:
    docs/orquestacion/reportes/OBJECIONES-<TU-NOMBRE>.md
  • Formato: archivo | qué hizo el otro | por qué discrepas | qué sugieres
  • Luego continúa con TUS tareas asignadas

▌ FUENTES DE VERDAD
  • Visual + funcional: Ultima_versión/seguimiento-zymo-v6 (88).html
  • JS extraído: docs/_html-extract/
  • Inventario: docs/_html-analysis.json

▌ DOCKER EN ESTE PC (si estás autorizado)
  Copy-Item .env.docker.local .env
  docker compose up --build -d
  docker compose logs -f
  App: http://localhost:82  |  Login prueba: admin_local / AdminLocal2026!

▌ DESPUÉS DE ESTA FASE
No ejecutes hasta aval. El humano irá chat por chat con:
  "Ejecuta lo que tenga tu nombre"
y solo harás lo que figure en docs/orquestacion/TAREAS-SPRINT.md
```

---

## Atajos por agente

| Agente | Reporte | Docker |
|--------|---------|--------|
| Claude Code | `reportes/REPORTE-CLAUDE-CODE.md` | ✅ |
| Codex | `reportes/REPORTE-CODEX.md` | ✅ |
| Minimax | `reportes/REPORTE-MINIMAX.md` | ❌ |

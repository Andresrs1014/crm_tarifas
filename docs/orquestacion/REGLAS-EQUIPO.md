# Reglas del equipo (4 agentes)

## Objetivo único

**Copiar a la perfección** `Ultima_versión/seguimiento-zymo-v6 (88).html` — visual **y** funcionalidad **100%**. El HTML manda.

---

## Skills — obligatorio

Leer **`SKILLS-OBLIGATORIAS.md`** al inicio de cada sesión. No saltar skills. No improvisar fuera de reglas.

---

## Flujo (3 fases)

1. `lee en docs/orquestacion/` → reconocimiento + reporte (**sin código**)
2. Líder (Cursor) → `TAREAS-SPRINT.md` + **aval humano**
3. `Ejecuta lo que tenga tu nombre` → solo tareas aprobadas

---

## Docker — solo este PC

| Agente | ¿Puede tocar Docker? |
|--------|----------------------|
| **Cursor** (líder) | ✅ |
| **Claude Code** | ✅ |
| **Codex** | ✅ |
| **Minimax** | ❌ **PROHIBIDO** |

Minimax: sin `docker-compose`, `.env`, Dockerfiles, comandos `docker compose`.

Ver: [DOCKER-EQUIPO-LOCAL.md](./DOCKER-EQUIPO-LOCAL.md)

---

## Feedback post-revisión (humano)

Tras aval o correcciones del humano, **Cursor (líder) no implementa todo**:

1. Identificar y listar cambios
2. Repartir tareas en `TAREAS-SPRINT.md` por agente (Claude GAP · Codex UI · Minimax investigación/config · Cursor integración)
3. Entregar comandos listos para pegar en cada chat
4. Implementar solo scope mínimo de líder

Ver detalle: [agentes/CURSOR-COMPOSER.md](./agentes/CURSOR-COMPOSER.md) § Feedback del humano.

---

- **No** modificar código ajeno para corregirlo
- **Sí** documentar objeciones en `reportes/OBJECIONES-<AGENTE>.md` o en tu reporte
- Seguir con tus propias tareas

---

## Visual

- Barlow + Barlow Condensed · sidebar 200px · header 60px
- CSS del HTML (`.stat-card`, `.form-grid`, etc.) — no UI genérica Tailwind

## Funcional

- Backend activo: `backend/src/` (Node/Prisma)
- Comparar con `docs/_html-extract/`

## Sin hardcode

- **Nada hardcoded** en código: datos, catálogos, URLs, colores sueltos → `.cursor/rules/06-no-hardcode.mdc`
- Catálogos HTML v6 → `frontend/src/lib/htmlV6/constants.ts` (una sola fuente)

## Git

- Commits solo cuando el humano lo pida

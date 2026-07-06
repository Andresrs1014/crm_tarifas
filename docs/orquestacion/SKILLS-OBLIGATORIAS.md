# Skills obligatorias — los 4 agentes

**Regla suprema:** antes de reconocimiento o ejecución, **leer y aplicar** estas skills y reglas. No improvisar fuera de ellas.

Si una tarea encaja en un dominio adicional → buscar skill con `find-skills` o en `~/.cursor/skills-cursor/` y `~/.claude/skills/`.

---

## Siempre (todos los agentes, cada sesión)

| # | Skill / regla | Ruta |
|---|---------------|------|
| 1 | Reglas repo CRM | `.cursorrules` |
| 2 | Orquestación paridad HTML | `.cursor/rules/00-orquestacion-paridad-html.mdc` |
| 3 | Ponytail / YAGNI | `.cursor/rules/skill-ponytail.mdc` |
| 4 | Workflow dev | `.cursor/rules/rule-dev-workflow.mdc` |
| 5 | Code review | `.cursor/rules/rule-code-review.mdc` |
| 6 | Seguridad | `.cursor/rules/rule-security.mdc` |
| 7 | Código limpio DoD | `.cursor/rules/02-codigo.mdc` |
| 7b | **Nada hardcoded** | `.cursor/rules/06-no-hardcode.mdc` |
| 8 | Reglas equipo orquestación | `docs/orquestacion/REGLAS-EQUIPO.md` |
| 9 | Objetivo y visión CRM | `docs/orquestacion/VISION-CRM.md` |

---

## Visual / frontend (Claude, Codex, Cursor; Minimax si toca UI)

| # | Skill | Ruta |
|---|-------|------|
| 10 | Frontend design | `.cursor/rules/skill-frontend-design.mdc` |
| 11 | Web design guidelines | `.cursor/rules/skill-web-design-guidelines.mdc` |
| 12 | Frontend design (Claude) | `~/.claude/skills/frontend-design/SKILL.md` |
| 13 | Web design guidelines (Claude) | `~/.claude/skills/web-design-guidelines/SKILL.md` |
| 14 | UI estética ZYMO | `.cursor/rules/03-estetica.mdc` |

**Instrucción:** leer el archivo completo antes de proponer o escribir CSS/componentes.

---

## Docker (solo Claude, Codex, Cursor — **Minimax PROHIBIDO**)

| # | Skill | Ruta |
|---|-------|------|
| 15 | Docker containerization | `~/.claude/skills/docker-containerization/SKILL.md` |
| 16 | Docker local CRM | `docs/orquestacion/DOCKER-EQUIPO-LOCAL.md` |

---

## Browser / QA visual (Claude, Codex, Cursor)

| # | Skill | Ruta |
|---|-------|------|
| 17 | Agent browser | `.cursor/rules/skill-agent-browser.mdc` |
| 18 | Agent browser (Claude) | `~/.claude/skills/agent-browser/SKILL.md` |
| 19 | Browser QA | `~/.claude/plugins/cache/ecc/ecc/1.10.0/skills/browser-qa/SKILL.md` |

---

## Backend / datos (Claude, Codex, Cursor)

| # | Skill | Ruta |
|---|-------|------|
| 20 | Backend patterns | `~/.claude/plugins/cache/ecc/ecc/1.10.0/skills/backend-patterns/SKILL.md` |
| 21 | Database migrations | `~/.claude/plugins/cache/ecc/ecc/1.10.0/skills/database-migrations/SKILL.md` |
| 22 | JWT security | `~/.claude/skills/jwt-security/SKILL.md` |

---

## Buscar/crear skills antes de implementar (todos los agentes, regla permanente)

**Regla:** antes de escribir una solución custom para un dominio con skill disponible, **buscar primero** (`find-skills`, `~/.cursor/skills-cursor/`, `~/.claude/skills/`) y **usarla**. Si no existe skill para el dominio, **crearla** en vez de reinventar la solución desde cero (Claude: plugin `skill-creator`; Cursor/Codex/Minimax: documentar el patrón reutilizable en `docs/orquestacion/referencia/` o su carpeta de skills propia).

**Excepción:** capacidades exclusivas de la plataforma Claude Code (plugins/skills que solo Claude puede invocar, ej. `skill-creator`) no son exigibles a Codex/Minimax/Cursor — cada agente aplica el equivalente de su propio ecosistema.

---

## Al revisar trabajo de otro agente (todos)

| # | Skill | Ruta |
|---|-------|------|
| 23 | Review security | `~/.cursor/skills-cursor/review-security/SKILL.md` |
| 24 | Review bugbot | `~/.cursor/skills-cursor/review-bugbot/SKILL.md` |

**Regla:** revisar = documentar en el reporte o en `reportes/OBJECIONES-*.md`. **No modificar** el código del otro agente.

---

## Checklist al iniciar sesión

```
[ ] Leí .cursorrules
[ ] Leí docs/orquestacion/REGLAS-EQUIPO.md y SKILLS-OBLIGATORIAS.md (este archivo)
[ ] Leí skills de mi rol (tabla arriba)
[ ] Sé si puedo tocar Docker (Minimax: NO)
[ ] Sé que revisar ≠ editar código ajeno
[ ] Busqué skill existente antes de implementar (o creé una si no existía)
```

---

## Objetivo único del proyecto

**Copiar a la perfección** el HTML `Ultima_versión/seguimiento-zymo-v6 (88).html` — visual **y** funcionalidad **100%** equivalente en React + Node/Prisma.

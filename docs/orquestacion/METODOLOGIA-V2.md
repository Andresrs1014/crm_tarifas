# Metodología v2 — Cursor + Claude + MiniMax

> **Desde:** 2026-06-22 · Decisión del humano  
> **Fin del modelo:** 4 agentes encadenados (Claude GAP → Codex UI → Cursor integra)

## Equipo activo

| Agente | Rol |
|--------|-----|
| **Cursor** | Orquestador, Docker, integración, QA en :82 |
| **Claude Code** | Módulos grandes — implementación visual + funcional |
| **MiniMax** | Módulos pequeños / fixes acotados |

**Fuera de este ciclo:** Codex (cerrado). Los GAP en `referencia/` ya existen; los agentes **implementan**, no re-documentan salvo que Cursor lo pida.

## Reglas

1. **Una tarea = un agente = un módulo (o scope acotado).** Sin dependencias entre Claude y MiniMax.
2. **Sin solapamiento de archivos** entre tareas paralelas (Cursor asigna scopes disjuntos).
3. **Paridad HTML v6** es el criterio: `Ultima_versión/seguimiento-zymo-v6 (88).html` manda.
4. **Anti-hardcode:** `.cursor/rules/06-no-hardcode.mdc` — clases `html-v6.css`, `domainConfig`, `constants`.
5. **Git:** trabajar en `main` (`.cursor/rules/07-git-main-solo.mdc`).
6. **MiniMax:** no toca Docker ni `.env`.
7. **Cursor** hace `docker compose up -d --build` tras merges de agentes.

## Flujo por oleada

```
Humano aval → Cursor publica TAREAS-SPRINT.md
     ↓
Claude + MiniMax en paralelo (scopes distintos)
     ↓
Cursor: build, Docker, L5 QA :82
     ↓
Humano aval → siguiente oleada
```

## Comandos agente

**Reconocimiento (opcional):**
```
lee en docs/orquestacion/
```

**Ejecución:**
```
Ejecuta lo que tenga tu nombre
```

## Oleada actual

Ver `TAREAS-SPRINT.md` § Oleada v2.

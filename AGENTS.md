# AGENTS — CRM Tarifas ZYMO

Todo el trabajo ocurre **en el PC local del humano** (Docker + browser + logs). Sin infra remota en este reinicio.

## Comando fase 1 — Reconocimiento

```
lee en docs/orquestacion/
```

→ Leer [docs/orquestacion/PROMPT-INICIO.md](docs/orquestacion/PROMPT-INICIO.md)  
→ Escribir informe en `docs/orquestacion/reportes/REPORTE-<AGENTE>.md`  
→ **No implementar código**

## Comando fase 3 — Ejecución (tras aval del líder)

```
Ejecuta lo que tenga tu nombre
```

→ Solo tareas en [docs/orquestacion/TAREAS-SPRINT.md](docs/orquestacion/TAREAS-SPRINT.md) con aval ✅

## Regla transversal

**Nada hardcoded** — [.cursor/rules/06-no-hardcode.mdc](.cursor/rules/06-no-hardcode.mdc) (datos, URLs, catálogos, colores; env + API + `htmlV6/constants`).

**Git en `main`** — [.cursor/rules/07-git-main-solo.mdc](.cursor/rules/07-git-main-solo.mdc) (trabajo solo: sin ramas feature; commit y push a `main`).

## Equipo

| Agente | Informe | Rol |
|--------|---------|-----|
| **Cursor Composer** | `reportes/REPORTE-CURSOR-COMPOSER.md` | Líder — consolida TAREAS-SPRINT |
| **Claude Code** | `reportes/REPORTE-CLAUDE-CODE.md` | Análisis HTML, módulos grandes |
| **Codex** | `reportes/REPORTE-CODEX.md` | CSS, build, layout preciso |
| **Minimax** | `reportes/REPORTE-MINIMAX.md` | Tareas pequeñas |

## Fuente de verdad

- Visual + funcional: `Ultima_versión/seguimiento-zymo-v6 (88).html`
- Referencia: `docs/_html-extract/`, `docs/_html-analysis.json`

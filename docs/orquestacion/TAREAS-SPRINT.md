# Tareas del sprint — Metodología v2

> **Orquestador:** Cursor · **Humano:** revisa :82 y reporta bugs a Cursor  
> **Docker:** http://localhost:82 · `admin_local` / `AdminLocal2026!`

---

## Regla oleada paralela

**Ningún agente bloquea al otro.** Tareas en carpetas/módulos distintos. Sin “espera a que termine X para hacer Y”.

| ❌ Evitar | ✅ Correcto |
|----------|-------------|
| Cursor X10 wizard mientras Claude X11 Biblioteca | Claude Biblioteca ∥ Cursor Matriz/GD |
| Migración Prisma que Claude necesite para columnas | Claude persiste en API/`columnas` Json existente |
| Mismo archivo editado por dos agentes | División por módulo |

---

## 🔴 ACTIVO — Oleada paralela independiente

| ID | Agente | Módulo | Archivos clave | Brief | Estado |
|----|--------|--------|----------------|-------|--------|
| **C18 / X11** | **Claude** | Biblioteca | `Biblioteca.tsx`, `html-v6.css`, `domainConfig` | [CLAUDE-C18-X11-BIBLIOTECA.md](./agentes/CLAUDE-C18-X11-BIBLIOTECA.md) | 🟡 |
| **X12** | **Cursor** | Matriz + GD | `MatrizRiesgos.tsx`, `GestionDocumental.tsx` | [CURSOR-X12-MATRIZ-GD.md](./agentes/CURSOR-X12-MATRIZ-GD.md) | 🟡 |

### Comando para Claude

```
Ejecuta lo que tenga tu nombre — tarea C18 / X11 Biblioteca Transporte y Paqueteo.

Brief: docs/orquestacion/agentes/CLAUDE-C18-X11-BIBLIOTECA.md
Spec: docs/orquestacion/referencia/SPEC-BIBLIOTECA-WIZARD.md §3–4
GAP: docs/orquestacion/referencia/GAP-BIBLIOTECA.md (BIB-05, BIB-06, BIB-08)

⛔ Solo frontend Biblioteca. No backend/, no WizardLayout, no MatrizRiesgos, no GestionDocumental.
⛔ Persistir columnas en campo Json existente (sin migración Prisma).
Referencia: Ultima_versión/seguimiento-zymo-v6 (88).html — TRANSP_SCHEMA, PAQUETEO_SCHEMA
```

### Cursor (esta sesión)

X12 Matriz + GD — ver [CURSOR-X12-MATRIZ-GD.md](./agentes/CURSOR-X12-MATRIZ-GD.md). **No esperar C18.**

---

## ⏸ Cola (secuencial, una oleada cada una)

| ID | Agente | Por qué espera |
|----|--------|----------------|
| **X10** | Codex/Claude | Wizard paso 3 — **después** de C18 (misma línea Transporte/Paqueteo, no paralelo) |
| **L5** | Humano | QA tras oleadas |
| **L4** | Cursor | Push cuando humano pida |

---

## ✅ Cerrado

| ID | Agente | Qué |
|----|--------|-----|
| **B1–B6** | Cursor | Backend M8 (GD, CrmMeta, cot aprobada, dashboard, import) |
| **C17** | Claude | GAPs + SPEC + Roadmap |
| C16, C13, M13, X1–X9 | — | Ver reportes |

---

## L5 QA — checklist humano

**Tras C18:** Biblioteca Transporte/Paqueteo, renombrar columnas.  
**Tras X12:** Matriz export Excel, filtros GD/Matriz.  
**Tras B1–B6 (ya en :82):** convertir cliente→GD, cot aprobada→pipeline, Kanban, dashboard actividad.

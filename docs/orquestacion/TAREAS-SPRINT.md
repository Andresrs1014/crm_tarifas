# Tareas del sprint — Metodología v2

> **Orquestador:** Cursor · **Humano:** revisa :82 y reporta bugs a Cursor  
> **Docker:** http://localhost:82 · `admin_local` / `AdminLocal2026!`

---

## 🔴 ACTIVO — Oleada paralela (2026-06-22)

| ID | Agente | Alcance | Brief | Estado |
|----|--------|---------|-------|--------|
| **C18 / X11** | **Claude** | Biblioteca Transporte + Paqueteo + columnas | [CLAUDE-C18-X11-BIBLIOTECA.md](./agentes/CLAUDE-C18-X11-BIBLIOTECA.md) | 🟡 **EN CURSO** |
| **B1–B6** | **Cursor** | Side-effects backend M8 | [SPEC-INTEGRACION-M8.md](./referencia/SPEC-INTEGRACION-M8.md) | 🟡 **EN CURSO** |
| **L10** | **Cursor** | Docker rebuild tras entregables | — | ⏸ tras B1–B6 + C18 |

**Sin solapamiento:** Claude → `frontend/` Biblioteca. Cursor → `backend/` únicamente.

### Comando para Claude

```
Ejecuta lo que tenga tu nombre — tarea C18 / X11 Biblioteca Transporte y Paqueteo.
Brief: docs/orquestacion/agentes/CLAUDE-C18-X11-BIBLIOTECA.md
Spec: docs/orquestacion/referencia/SPEC-BIBLIOTECA-WIZARD.md §3–4
GAP: docs/orquestacion/referencia/GAP-BIBLIOTECA.md (BIB-05, BIB-06, BIB-08)
⛔ No tocar backend/ ni WizardLayout paso 3.
Referencia HTML: Ultima_versión/seguimiento-zymo-v6 (88).html (TRANSP_SCHEMA, PAQUETEO_SCHEMA)
```

---

## ⏸ Siguiente (tras C18 + B1–B6)

| ID | Agente | Alcance |
|----|--------|---------|
| **X10** | Codex / Claude | Wizard paso 3 = tablas HTML (CO-09, CO-10) |
| **X12** | Codex | Matriz export Excel, pulido GD |
| **L5** | Humano | QA checklist :82 |
| **L4** | Cursor | Push cuando humano pida |

---

## ✅ Cerrado

| ID | Agente | Qué |
|----|--------|-----|
| **C17** | Claude | GAP refresh + SPEC Biblioteca/Wizard + SPEC M8 + Roadmap |
| C8–C16 | Claude | GAPs + paridad visual módulos |
| C13 | Claude | Cotizaciones lista visual |
| M13 | MiniMax | Shell |
| X1–X6, X9 | Codex | Prospectos, CRM, Clientes, Detalle |
| Cursor | Biblioteca línea colapsable, Detalle servicios, wizard fixes | commit oleada anterior |

Reportes: `reportes/REPORTE-CLAUDE-CODE.md` · `REPORTE-MINIMAX.md` · `REPORTE-CODEX-EJECUCION.md`

---

## L5 QA — checklist humano

Marcar en :82 (Ctrl+F5) tras C18 + B1–B6:

- [ ] Biblioteca → Transporte (grupos Local/Otros, columnas schema)
- [ ] Biblioteca → Paqueteo (tabs COORDINADORA/TCC/SERVIENTREGA)
- [ ] Convertir prospecto → cliente → GD con 18 docs BASC
- [ ] Nuevo prospecto → aparece en Kanban CRM
- [ ] Cotización aprobada → prospecto en `aceptacion_propuesta`
- [ ] Dashboard → `actividad_por_comercial` no vacío
- [ ] Import Excel prospectos → Kanban + actividades

---

## Referencia rápida

| Doc | Para qué |
|-----|----------|
| [ROADMAP-PARIDAD-HTML.md](./ROADMAP-PARIDAD-HTML.md) | Estado por módulo |
| [referencia/GAP-*.md](./referencia/) | Brechas HTML vs React |
| [SPEC-INTEGRACION-M8.md](./referencia/SPEC-INTEGRACION-M8.md) | Backend B1–B6 |
| [SPEC-BIBLIOTECA-WIZARD.md](./referencia/SPEC-BIBLIOTECA-WIZARD.md) | Biblioteca + Wizard |

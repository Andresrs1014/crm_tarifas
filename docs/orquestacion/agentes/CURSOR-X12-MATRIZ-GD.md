# X12 — Matriz de Riesgos + Gestión Documental (Cursor)

**Agente:** Cursor  
**Estado:** 🟡 ACTIVO (paralelo con Claude C18 — **sin dependencias**)  
**Docker QA:** http://localhost:82

---

## Regla de oleada

**Cero dependencia con C18/X11 (Biblioteca).** No tocar `Biblioteca.tsx`, `WizardLayout.tsx`, ni schemas Transporte/Paqueteo.

---

## Objetivo

Cerrar brechas visuales y funcionales de **Matriz de Riesgos** y **Gestión Documental** según GAPs.

---

## Fuentes

| Doc | Alcance |
|-----|---------|
| [GAP-MATRIZ-RIESGOS.md](../referencia/GAP-MATRIZ-RIESGOS.md) | MR-02 a MR-06 (prioridad export Excel) |
| [GAP-GESTION-DOCUMENTAL.md](../referencia/GAP-GESTION-DOCUMENTAL.md) | GD-02 a GD-08 residual |

---

## Alcance mínimo

### MatrizRiesgos.tsx
- MR-06: botón export Excel (patrón similar a GD si ya existe)
- MR-02: filtro compañía incluye "Aduana"
- MR-03–MR-05: `filter-input`, `table-card`, KPI strip HTML v6

### GestionDocumental.tsx
- GD-02–GD-05: filtros, `table-card`, badges `.stag`
- GD-06–GD-08: estilos → `domainConfig` / `constants`

---

## ⛔ Fuera de alcance (otro agente / otra oleada)

- Biblioteca Transporte/Paqueteo (Claude C18)
- Wizard cotizaciones paso 3 (X10 — **después** de C18, no en paralelo con dependencia)
- Backend (B1–B6 ya cerrado)

---

## Done

- `npm run build` frontend OK
- Docker rebuild frontend (L10)
- Sin conflictos en archivos de Biblioteca

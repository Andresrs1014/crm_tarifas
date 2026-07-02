# C18 / X11 — Biblioteca Transporte + Paqueteo

**Agente:** Claude Code  
**Estado:** 🟡 ACTIVO (oleada paralela con Cursor B1–B6)  
**Docker QA:** http://localhost:82 · `admin_local` / `AdminLocal2026!`

---

## Objetivo

Implementar paridad HTML v6 en **Biblioteca de Tarifas** para líneas **Transporte** y **Paqueteo**, más renombrar columnas en líneas estándar.

**⛔ No tocar:** `backend/` · `MatrizRiesgos.tsx` · `GestionDocumental.tsx` · `WizardLayout.tsx`  
**⛔ Sin migración Prisma** — usar `BibliotecaLinea.columnas` Json y APIs existentes.  
**Independencia:** Cursor trabaja Matriz/GD (X12) en paralelo; no hay dependencia entre vosotros.

---

## Fuentes obligatorias

| Doc | Uso |
|-----|-----|
| [SPEC-BIBLIOTECA-WIZARD.md](../referencia/SPEC-BIBLIOTECA-WIZARD.md) | §3 Transporte, §4 Paqueteo, §6 AC-01–AC-06 |
| [GAP-BIBLIOTECA.md](../referencia/GAP-BIBLIOTECA.md) | BIB-05, BIB-06, BIB-08 |
| `Ultima_versión/seguimiento-zymo-v6 (88).html` | `TRANSP_SCHEMA`, `PAQUETEO_SCHEMA`, render Biblioteca |
| `frontend/src/pages/Biblioteca.tsx` | Punto de partida (línea colapsable, grupos siempre visibles) |

---

## Alcance

### BIB-05 — Transporte
- Botones "+ Nuevo grupo Transporte Local" / "+ Nuevo grupo Otros Servicios"
- Tablas con columnas de `TRANSP_SCHEMA` (no col1/col2/col3 genéricos)
- Celdas editables con tipo moneda / porcentaje / texto según schema

### BIB-06 — Paqueteo
- Tabs por paqueteadora: COORDINADORA, TCC, SERVIENTREGA
- Grupos según `PAQUETEO_SCHEMA` filtrados por tab activo
- Columnas dinámicas por tipo de grupo

### BIB-08 — Renombrar columnas (líneas estándar)
- Panel "Columnas de la tabla" persiste nombres col1/col2/col3
- **Prisma:** hoy `BibliotecaLinea.columnas` es `Json`; si hace falta `colHeaders`, añadir migración mínima **solo si** no puedes persistir en `columnas` existente

---

## Reglas

- Mantener: **solo la línea colapsa**; grupos **siempre visibles** al expandir (BIB-07)
- Reutilizar clases en `frontend/src/styles/html-v6.css`
- `npm run build` debe pasar
- Reportar en `docs/orquestacion/reportes/REPORTE-CLAUDE-CODE.md` § C18

---

## Criterios de aceptación

Ver SPEC §6 AC-01 a AC-06 + AC-10 (`npm run build`).

---

## Handoff

Tras C18 → **X10** (Wizard paso 3) o Cursor **L10** (Docker rebuild).

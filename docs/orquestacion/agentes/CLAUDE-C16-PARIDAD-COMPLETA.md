# Claude C16 — Paridad HTML v6 (todo lo pendiente)

**Autorizado por Cursor (orquestador) · 2026-06-30**  
**Prioridad #1:** que se **vea igual** al HTML monolito. Funcionalidad #2 (no romper lo existente).

## Comando humano

```
Ejecuta lo que tenga tu nombre — tarea C16 paridad HTML completa.
Brief: docs/orquestacion/agentes/CLAUDE-C16-PARIDAD-COMPLETA.md
```

---

## Fuente de verdad

| Recurso | Ruta |
|---------|------|
| HTML monolito | `Ultima_versión/seguimiento-zymo-v6 (88).html` |
| GAPs por módulo | `docs/orquestacion/referencia/GAP-*.md` |
| CSS v6 | `frontend/src/styles/html-v6.css` |
| Config | `frontend/src/lib/htmlV6/domainConfig.ts`, `constants.ts` |
| Anti-hardcode | `.cursor/rules/06-no-hardcode.mdc` |

**Entorno:** http://localhost:82 · `admin_local` / `AdminLocal2026!`  
**No toques:** Docker, `.env`, `docker-compose.yml`.

---

## Criterio de Done (cada módulo)

- [ ] `section-title`, `table-card`, `table-header-2row`, `filter-input`, `filter-select`, `form-grid`, `btn-primary` como en HTML
- [ ] Layout ancho (sin `max-w-*` innecesarios que estrechen vs HTML)
- [ ] Sin clases Tailwind genéricas donde el HTML usa clase v6 (`card-glass` solo si el GAP lo permite)
- [ ] `npm run build` en `frontend/` sin errores
- [ ] Entrada en `docs/orquestacion/reportes/REPORTE-CLAUDE-CODE.md` § **C16** (subsección por módulo)

---

## Orden de implementación (obligatorio)

Trabaja **módulo por módulo** en este orden. No saltes sin cerrar checklist del anterior.

### 1. Matriz de Riesgos — `pages/MatrizRiesgos.tsx`

**GAP:** `referencia/GAP-MATRIZ-RIESGOS.md`

- [ ] `section-title`
- [ ] KPI strip estilo HTML (no solo `card-glass` si GAP pide `crm-kpi-strip` / border-top)
- [ ] Filtros → `filter-input` / `filter-select`
- [ ] Tabla → `table-card`
- [ ] Opción compañía **Aduana** en filtro (GAP 🔴)
- [ ] Mover `RIESGO_STYLE` / opciones a `domainConfig` si aplica

### 2. Gestión Documental — `pages/GestionDocumental.tsx`

**GAP:** `referencia/GAP-GESTION-DOCUMENTAL.md`

- [ ] `section-title`, layout tabs/cards HTML
- [ ] Tabla documentos → `table-card`
- [ ] Badges estados documento como HTML

### 3. Equipo comercial — `pages/Equipo.tsx`

**Referencia HTML:** `page-equipo` (sidebar "Equipo")

- [ ] Paridad visual lista + formulario comerciales
- [ ] `section-title`, `table-card`, ranking si existe en HTML

### 4. Herramientas (GAP C12) — tres rutas

**GAP:** `referencia/GAP-HERRAMIENTAS.md`

| Ruta | Archivo |
|------|---------|
| `/preliquidador` | `Preliquidador.tsx` |
| `/cotizador` | `CotizadorPaqueteo.tsx` |
| `/fichas` | `FichaCliente.tsx`, `FichaDetalle.tsx` |

- [ ] `section-title` en cada uno
- [ ] Preliquidador: contenedor `table-card` / `form-card` según GAP
- [ ] Cotizador: mantener gold header si HTML lo tiene
- [ ] Fichas: tabla lista + detalle alineados al HTML

### 5. Calendario visitas — `pages/CalendarioVisitas.tsx`

- [ ] Paridad `page-calendario`: grid/cards, filtros v6
- [ ] `section-title`

### 6. SAC — `pages/SAC.tsx`

- [ ] Paridad `page-sac`: stats, tabs, modales con clases v6
- [ ] `section-title`

---

## Oleada secundaria (si queda tiempo)

Solo después de cerrar §1–6. **No bloquea** el entregable principal.

| Módulo | Archivo | GAP |
|--------|---------|-----|
| Prospectos | `Prospectos.tsx` | GAP-PROSPECTOS |
| CRM | `CRMKanban.tsx` | GAP-CRM |
| Clientes | `Clientes.tsx` | GAP-CLIENTES |
| Detalle | `Detalle.tsx`, `DetalleCrmPanel.tsx` | GAP-DETALLE |
| Cotizaciones wizard | `wizard/WizardLayout.tsx` | GAP-COTIZACIONES § wizard |
| Dashboard | `Dashboard.tsx` | GAP-DASHBOARD-* |

Enfócate en brechas 🔴 y 🟡 del GAP; no reescribir lógica que ya funciona.

---

## Fuera de scope C16 (Cursor / humano)

- Bugs reportados en vivo por el humano a **Cursor** (ej. modales, flujos rotos)
- Backend B1–B6 (`ESTADO-ACTUAL.md`)
- Git commit / Docker rebuild → **Cursor** tras tu entrega

---

## Entregable final

1. Código en los archivos listados arriba (+ `html-v6.css` solo reglas necesarias)
2. `REPORTE-CLAUDE-CODE.md` § **C16** con tabla módulo | hecho | pendiente
3. Mensaje final: *"C16 listo para integración Cursor"* con lista de rutas a probar en :82

---

## Reglas

- Un commit lógico por módulo (opcional); el humano trabaja en `main`
- No dependas de MiniMax ni de Cursor mid-sprint
- Si un módulo ya cumple el GAP, documenta ✅ y pasa al siguiente
- Ante duda visual → gana el HTML, no inventes UI Tailwind genérica

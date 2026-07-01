# REPORTE — CLAUDE CODE

**Fecha:** 2026-06-25  
**Fase:** Reconocimiento (sin implementación)  
**Equipo:** solo este PC, Docker local  
**Modelo:** claude-sonnet-4-6

---

## 1. Qué leí / qué revisé

- [x] docs/orquestacion/PROMPT-GENERAL-AGENTES.md
- [x] docs/orquestacion/SKILLS-OBLIGATORIAS.md
- [x] docs/orquestacion/README.md
- [x] docs/orquestacion/VISION-CRM.md
- [x] docs/orquestacion/REGLAS-EQUIPO.md
- [x] docs/orquestacion/ROADMAP-PARIDAD-HTML.md
- [x] docs/orquestacion/ESTADO-ACTUAL.md
- [x] docs/orquestacion/TAREAS-SPRINT.md
- [x] docs/orquestacion/agentes/CLAUDE-CODE.md
- [x] docs/_html-extract/page-dashboard.html
- [x] docs/_html-extract/page-registro.html
- [x] docs/_html-extract/renderDashboard.js
- [x] docs/_html-analysis.json (estructura módulos)
- [x] Ultima_versión/seguimiento-zymo-v6 (88).html — CSS: líneas 1–300 aprox.
- [x] frontend/src/index.css (design system actual)
- [x] frontend/src/App.tsx (rutas)
- [x] frontend/src/components/layout/Sidebar.tsx
- [x] frontend/src/pages/Dashboard.tsx (fragmento)
- [x] frontend/src/pages/Registro.tsx (fragmento)
- [x] frontend/src/pages/Prospectos.tsx (fragmento)
- [x] backend/src/ — listado completo de módulos

---

## 2. Estado que encontré

### Docker (este equipo)

- `.env.docker.local` existe ✅
- `.env` — **no copiado aún** (Docker no está corriendo; `docker compose ps` retornó vacío)
- URLs NO probadas: Docker está abajo

### Repo / código

**Lo que funciona:**
- Estructura de rutas completa en App.tsx (15 módulos del HTML ya tienen ruta React)
- Backend Node/Prisma con módulos para records, cotizaciones, dashboard, comerciales, biblioteca, CRM, GD, preliquidador, SAC, fichas, usuarios
- Design system parcialmente portado en `index.css` (html-stat-card, html-chart-card, badges, table-card)
- `docs/_html-extract/` tiene extraídas las funciones clave: renderDashboard, saveRecord, clearForm, buildServiceChips, billing, contactos

**Lo que falta / está desalineado (ver sección 3):**
- Fuente: el HTML usa `Barlow` y `Barlow Condensed`; el React actual declara `DM Sans` como fallback en `index.css` (body) y solo usa `Barlow Condensed` inline en componentes
- Sidebar: HTML = 200px, `background: var(--surface)` (#0e1320), nav-tab uppercase 14px Barlow Condensed. React Sidebar = 220px, `#111827`, lucide-react icons, fuente DM Sans/sm. **Diferencia: 20px ancho, fuente, background**
- Header: HTML = 60px sticky. React Header tiene `top: 70px` en el sidebar (inconsistencia interna)
- `.main { padding: 20px 24px }` en HTML. React usa padding de Tailwind variable
- CSS de `.form-card`, `.form-grid`, `.form-group`, `.service-chip`, `.type-toggle` — no están en `index.css` como clases nativas; los componentes los reimplementan inline con Tailwind
- `.section-title` en HTML es Barlow Condensed 24px 800 uppercase. En React es `font-bold text-2xl` DM Sans
- `.chart-title` en HTML tiene `::before` con barra cyan (4px × 16px). En React no existe esa barra

---

## 3. Hallazgos principales

1. **Fuente base incorrecta:** `index.css` pone `DM Sans` como familia global. El HTML usa `Barlow` (body) y `Barlow Condensed` (títulos, valores numéricos, badges). La carga de Barlow está en `index.html` pero no se aplica en `body`. Esto es el desvío visual más barato de corregir.

2. **Sidebar 220px vs 200px + fuente diferente:** La sidebar React tiene 220px y usa DM Sans/sm. El HTML usa 200px, Barlow Condensed 14px uppercase peso 600. Los nav-tabs del HTML son botones con `border-left: 3px solid transparent` y `letter-spacing: 1px`. La diferencia es perceptible en densidad.

3. **CSS del HTML no está extraído como archivo:** `docs/orquestacion/ROADMAP-PARIDAD-HTML.md` pide `frontend/src/styles/html-v6.css` pero no existe. Las clases `.stat-card`, `.chart-card`, `.chart-title`, `.form-card`, `.form-grid`, `.service-chip`, `.type-toggle`, `.type-btn`, `.modal-col-full` no tienen definición centralizada en React — cada página las reimplementa con Tailwind inline o clases custom en `index.css` bajo nombres `html-*`.

4. **Dashboard gap funcional menor:** El React Dashboard ya tiene `computeMainStats`, `computeBillingTotals`, `renderBillingDashboard`, `renderCotDashboard` como funciones compute. El HTML extrae `renderDashboard.js`, `renderBillingDashboard.js`, `renderCotDashboard.js` y `drawCharts.js`. El React usa Recharts en lugar de Chart.js — los datos se calculan igual pero la visualización (colores, bordes, aspect ratios) puede diferir.

5. **15 módulos en HTML, 15 rutas en React — cobertura estructural OK pero contenido pendiente:** según ROADMAP, solo Dashboard y Registro están en `🟡 En progreso`. Los 13 restantes (Prospectos, CRM, Clientes, Cotizaciones, Biblioteca, Matriz, GD, Preliquidador, Calendario, Cotizador, Fichas, SAC, Equipo) están en `⬜ Pendiente` — visual y funcional por validar.

---

## 4. Riesgos / bloqueos

| Bloqueo | Severidad | Quién debería resolverlo |
|---------|-----------|-------------------------|
| Docker abajo — no se puede hacer QA visual del React actual | MEDIA | Claude Code (levantar con `.env.docker.local`) |
| `Barlow` no aplicado en body — desvío visual global | ALTA | CODEX (design system) |
| Sin `html-v6.css` extraído — clases del HTML dispersas | ALTA | Claude Code (extracción CSS referencia) |
| Sidebar 220px vs 200px — layout global incorrecto | ALTA | CODEX |
| 13 módulos sin validar visual ni funcional | MEDIA | Claude + Codex según ROADMAP |
| `chart-title::before` (barra cyan) ausente en React | BAJA | CODEX |

---

## 5. Propuesta de tareas para mí (borrador)

> El líder (Cursor) consolidará esto en TAREAS-SPRINT.md. No ejecutar hasta aval.

- [ ] **C-1:** Extraer CSS completo del HTML referencia → `docs/orquestacion/referencia/html-v6-styles.css`  
  _(leer bloque `<style>` completo del HTML y guardarlo como archivo CSS puro, sin modificar)_
- [ ] **C-2:** Documento GAP detallado por módulo (15 módulos) → `docs/orquestacion/referencia/GAP-MODULOS.md`  
  _(recorrer cada `page-*` del HTML y comparar campo a campo con la página React correspondiente)_
- [ ] **C-3:** Portar módulos de ROADMAP asignados a CLAUDE: Prospectos, CRM Pipeline, Cotizaciones, Gestión Documental, Preliquidador, Cotizador Paqueteo, Fichas de Cliente, Detalle Registro  
  _(después de aval; requiere que CODEX entregue design system primero)_
- [ ] **C-4:** Levantamiento Docker local y prueba E2E básica (agent-browser) comparando HTML vs React en Dashboard + Registro

---

## 6. Propuesta de tareas para otros agentes

- **@CODEX / @CURSOR:** Prioridad máxima — corregir `font-family` en `body` de `index.css` a `'Barlow', sans-serif`, ajustar sidebar a 200px y fuente nav-tab a Barlow Condensed 14px uppercase. Sin esto toda la QA visual estará sesgada.
- **@CODEX:** Extraer y centralizar las clases CSS que el HTML usa nativamente (`.form-card`, `.form-grid`, `.service-chip`, `.type-toggle`, `.type-btn`, `.modal-col-full`) en `index.css` con nombres idénticos al HTML, no con prefijo `html-*`.
- **@MINIMAX:** Módulos simples post design-system: Equipo Comercial, Calendario, SAC.

---

## C17 — Cierre paridad HTML v6 (auditoría + specs) — 2026-07-01

### Resumen ejecutivo

- **GAP-BIBLIOTECA.md** actualizado: detectados 5 nuevos gaps (BIB-05 a BIB-09) — Transporte y Paqueteo no tienen renderizador especializado en React; BIB-01 marcado ✅ C16.
- **GAP-COTIZACIONES.md** actualizado: CO-01 a CO-04, CO-06 a CO-08 marcados ✅ C13; CO-05 (aprobar→pipeline) sigue abierto → B4; nuevos CO-09/CO-10 para Wizard paso 3 Transporte/Paqueteo.
- **GAP-DETALLE.md** actualizado: D-01 a D-07 marcados ✅ Codex X9; nuevos D-08 (facturación tab) y D-09 (GD en conversión → B2).
- **GAP-HERRAMIENTAS.md** actualizado: H-01 a H-03 y H-10/H-11 marcados ✅ C16; H-04 parcial; H-05 a H-09 abiertos para X12.
- **SPEC-BIBLIOTECA-WIZARD.md** creado: spec completa para X11 (Biblioteca Transporte/Paqueteo/estándar) y X10 (Wizard paso 3) con 10 criterios de aceptación.
- **SPEC-INTEGRACION-M8.md** creado: 6 fixes de backend (B1–B6) con pseudocódigo, archivos exactos y criterios de aceptación verificables con curl.
- **ROADMAP-PARIDAD-HTML.md** actualizado: módulos validados marcados ✅, pendientes backend marcados 🟡, fila "Integración backend" ⬜ añadida.
- La mayor deuda técnica visible restante: Biblioteca Transporte/Paqueteo (X11), Wizard paso 3 (X10), backend B2/B3/B4.

### Archivos tocados (solo documentación)

| Archivo | Acción |
|---------|--------|
| `docs/orquestacion/referencia/GAP-BIBLIOTECA.md` | Actualizado — §Estado post-C17, BIB-05 a BIB-09 |
| `docs/orquestacion/referencia/GAP-COTIZACIONES.md` | Actualizado — §Estado post-C17, CO-09/CO-10, aclaración B4 |
| `docs/orquestacion/referencia/GAP-DETALLE.md` | Actualizado — §Estado post-C17, D-08/D-09 |
| `docs/orquestacion/referencia/GAP-HERRAMIENTAS.md` | Actualizado — §Estado post-C17, MR-06, FD-01 |
| `docs/orquestacion/referencia/SPEC-BIBLIOTECA-WIZARD.md` | Creado |
| `docs/orquestacion/referencia/SPEC-INTEGRACION-M8.md` | Creado |
| `docs/orquestacion/ROADMAP-PARIDAD-HTML.md` | Actualizado — columna funcional backend, fase 3 |

### Sin cambios en `frontend/` ni `backend/`

`npm run build` no aplica (ningún archivo de código modificado).

### Orden recomendado post-C17

| Orden | Tarea | Agente | Spec |
|-------|-------|--------|------|
| 1 | X11 — Biblioteca Transporte + Paqueteo + col1/col2/col3 | Codex | SPEC-BIBLIOTECA-WIZARD §2–4 |
| 2 | X10 — Wizard paso 3 Transporte/Paqueteo | Codex | SPEC-BIBLIOTECA-WIZARD §5 |
| 3 | B1 — Endpoint duplicado `/api/actividades/vencidas` | Cursor | SPEC-INTEGRACION-M8 §B1 |
| 4 | B2 — GD en `convertProspectToCliente` | Cursor | SPEC-INTEGRACION-M8 §B2 |
| 5 | B3 — CrmMeta en `createRecord` | Cursor | SPEC-INTEGRACION-M8 §B3 |
| 6 | B4 — Aprobar cotización avanza pipeline | Cursor | SPEC-INTEGRACION-M8 §B4 |
| 7 | B5 — Import masivo CrmMeta + transacción | Cursor | SPEC-INTEGRACION-M8 §B5 |
| 8 | B6 — `actividad_por_comercial` Dashboard | Cursor | SPEC-INTEGRACION-M8 §B6 |
| 9 | L5 — QA integración en :82 post-B1–B6 | Humano | Roadmap Fase 3 |

---

## C16 — Paridad HTML v6 completa (2026-06-30)

### Módulos primarios (§1–6)

| Módulo | Archivo | Cambios | Estado |
|--------|---------|---------|--------|
| Matriz de Riesgos | `MatrizRiesgos.tsx` | `section-title`, `crm-kpi-strip/cell`, `filter-input/select`, `table-card`, + opción Aduana en filtro, sin `Search` icon | ✅ |
| Gestión Documental | `GestionDocumental.tsx` | `section-title`, `crm-kpi-strip/cell` con CSS vars, `filter-input/select`, `table-card`, `bg-surface` en slide-in, sin `Search` icon | ✅ |
| Equipo Comercial | `Equipo.tsx` | `section-title` | ✅ |
| Preliquidador | `Preliquidador.tsx` | `section-title`, `card-glass` → `card` en containers de pasos | ✅ |
| Cotizador Paqueteo | `CotizadorPaqueteo.tsx` | `section-title` (sin emoji) | ✅ |
| Fichas de Cliente | `FichaCliente.tsx` | `section-title` (sin emoji) | ✅ |
| Calendario Visitas | `CalendarioVisitas.tsx` | `section-title`, `crm-kpi-strip/cell`, `filter-select`, `bg-[#111827]` → `bg-surface` en panel | ✅ |
| SAC | `SAC.tsx` | `section-title` (sin emoji), `crm-kpi-strip/cell` con CSS vars | ✅ |

### Módulos secundarios — ya conformes al revisarlos

| Módulo | Estado |
|--------|--------|
| Prospectos | ✅ ya tenía `section-title`, `table-header-2row`, `table-title`, filtros v6 |
| CRM Pipeline | ✅ ya tenía `section-title`, `filter-select`, `COMPANIAS_FILTER_OPTIONS` |
| Clientes | ✅ ya tenía `section-title`, `table-header-2row`, `table-title`, filtros v6 |
| Detalle | ✅ usa clases `detalle-*` propias, constantes ya importan de domainConfig |

### Pendiente (fuera de scope C16)

| ID | Brecha | Por qué no |
|----|--------|-----------|
| D-01 | Campos `estadoProspecto`, `visita`, `facturado` sin UI en panel Detalle | Requiere ampliar `DetalleEditState` — riesgo funcional alto |
| MR-06 | Export Excel en MatrizRiesgos | Feature nueva, no brecha visual |
| H-07 | Mover `COURIERS`/`COL_DEPTS` a constants.ts | Refactor sin impacto visual |

### Build

`npm run build` → ✅ sin errores TypeScript en todos los módulos modificados

### Rutas a probar en :82

- `/matriz-riesgos` — section-title, KPI strip, filtros, Aduana
- `/gestion-documental` — section-title, KPI strip, filtros, tabla
- `/equipo` — section-title
- `/preliquidador` — section-title, card (sin glass)
- `/cotizador` — section-title sin emoji
- `/fichas` — section-title sin emoji
- `/calendario` — section-title, KPI strip, panel sin hardcode
- `/sac` — section-title sin emoji, KPI strip

---

## C13 — Cotizaciones paridad HTML v6 (2026-06-30)

### Qué cambió

| ID | Brecha | Estado |
|----|--------|--------|
| CO-01 | `section-title` ausente | ✅ `<h2 className="section-title">Cotizaciones</h2>` |
| CO-02 | `.table-header-2row` ausente | ✅ Título + botones + filtros envueltos en `table-header-2row` dentro del `table-card` |
| CO-03 | `.table-title` ausente | ✅ `<span className="table-title">Lista de Cotizaciones</span>` dentro del header |
| CO-04 | KPI strip era texto inline | ✅ `<div className="crm-kpi-strip">` con 4 celdas (Total / Aprobadas / Enviadas / Rechazadas) |
| CO-06 | Texto botón "Nueva" corto | ✅ Cambiado a "+ Nueva Cotización" |
| CO-07 | `ESTADO_NEXT` / `ESTADO_NEXT_LABEL` hardcoded | ✅ Movido a `domainConfig.ts` como `COTIZACION_ESTADO_NEXT` / `COTIZACION_ESTADO_NEXT_LABEL` |
| CO-08 | Colores hardcoded en CotPublica.tsx | ✅ `#0a0e1a` → `var(--bg)`, `#111827` → `var(--surface)` |

### Archivos tocados

- `frontend/src/pages/Cotizaciones.tsx` — estructura JSX (section-title, KPI strip, table-header-2row), imports desde domainConfig
- `frontend/src/pages/CotPublica.tsx` — CSS vars en lugar de hex hardcodeados
- `frontend/src/lib/htmlV6/domainConfig.ts` — añadidos `COTIZACION_ESTADO_NEXT` y `COTIZACION_ESTADO_NEXT_LABEL`

### Build

`npm run build` → ✅ sin errores TypeScript ni de compilación

### No implementado

- CO-05 (¿aprobar cotización avanza `estadoProspecto`?) — requiere investigación de lógica de negocio, fuera del scope visual de C13

---

## 7. Listo para ejecución

- [x] Informe completo — el humano puede volver al líder (Cursor Composer)

---

## Apéndice — Inventario HTML vs React

| Módulo HTML | Ruta React | Archivo React | Estado |
|-------------|------------|---------------|--------|
| page-dashboard | /dashboard | Dashboard.tsx | 🟡 En progreso |
| page-registro | /registro | Registro.tsx | 🟡 En progreso |
| page-prospectos | /prospectos | Prospectos.tsx | ⬜ Sin validar |
| page-crm | /crm | CRMKanban.tsx | ⬜ Sin validar |
| page-clientes | /clientes | Clientes.tsx | ⬜ Sin validar |
| page-equipo | /equipo | Equipo.tsx | ⬜ Sin validar |
| page-cotizaciones | /cotizaciones | Cotizaciones.tsx | ⬜ Sin validar |
| page-biblioteca | /biblioteca | Biblioteca.tsx | ⬜ Sin validar |
| page-matriz-riesgos | /matriz-riesgos | MatrizRiesgos.tsx | ⬜ Sin validar |
| page-gestion-documental | /gestion-documental | GestionDocumental.tsx | ⬜ Sin validar |
| page-preliquidador | /preliquidador | Preliquidador.tsx | ⬜ Sin validar |
| page-calendario | /calendario | CalendarioVisitas.tsx | ⬜ Sin validar |
| page-cotizador | /cotizador | CotizadorPaqueteo.tsx | ⬜ Sin validar |
| page-ficha-cliente | /fichas | FichaCliente.tsx | ⬜ Sin validar |
| page-sac | /sac | SAC.tsx | ⬜ Sin validar |
| page-detalle | /detalle/:id | Detalle.tsx | ⬜ Sin validar |
| page-cot-publica | /cot/:numero | CotPublica.tsx | ⬜ Sin validar |

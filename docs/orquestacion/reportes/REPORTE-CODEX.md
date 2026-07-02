# REPORTE - CODEX

**Fecha:** 2026-06-25  
**Fase:** Reconocimiento (sin implementacion)  
**Equipo:** solo este PC, Docker local

---

## 1. Que lei / que revise

- [x] AGENTS.md / reglas globales del proyecto
- [x] docs/orquestacion/PROMPT-GENERAL-AGENTES.md
- [x] docs/orquestacion/SKILLS-OBLIGATORIAS.md
- [x] docs/orquestacion/PROMPT-INICIO.md
- [x] docs/orquestacion/README.md
- [x] docs/orquestacion/VISION-CRM.md
- [x] docs/orquestacion/REGLAS-EQUIPO.md
- [x] docs/orquestacion/DOCKER-EQUIPO-LOCAL.md
- [x] docs/orquestacion/agentes/CODEX.md
- [x] docs/orquestacion/reportes/PLANTILLA-REPORTE.md
- [x] .cursorrules
- [x] .cursor/rules/00-orquestacion-paridad-html.mdc
- [x] .cursor/rules/skill-ponytail.mdc
- [x] .cursor/rules/rule-dev-workflow.mdc
- [x] .cursor/rules/rule-code-review.mdc
- [x] .cursor/rules/rule-security.mdc
- [x] .cursor/rules/02-codigo.mdc
- [x] .cursor/rules/skill-frontend-design.mdc
- [x] .cursor/rules/skill-web-design-guidelines.mdc
- [x] .cursor/rules/03-estetica.mdc
- [x] .cursor/rules/skill-agent-browser.mdc
- [x] Skills disponibles del entorno: frontend-design, web-design-guidelines, agent-browser, docker-containerization, jwt-security, backend-patterns, database-migrations, browser-qa, review-security, review-bugbot
- [x] HTML/inventario: Ultima_version/seguimiento-zymo-v6 (88).html, docs/_html-analysis.json, docs/_html-extract/
- [x] Frontend relevante: frontend/src/index.css, frontend/src/components/layout/Layout.tsx, Header.tsx, Sidebar.tsx, Dashboard.tsx, Registro.tsx, frontend/tailwind.config.js
- [x] Build/Docker: frontend npm build, backend npm build, docker compose config, docker compose build frontend, docker compose up --build -d, health local

---

## 2. Estado que encontre

### Docker (este equipo)

- `.env` existe y `docker compose config` resuelve correctamente.
- `npm run build` en frontend: pasa. Advertencia: bundle principal grande (`index-*.js` ~2.1 MB, gzip ~616 kB).
- `npm run build` en backend: pasa.
- `docker compose build frontend`: pasa.
- `docker compose up --build -d`: pasa. Servicios levantados: postgres healthy, backend healthy, frontend up.
- URLs probadas:
  - http://localhost:82 -> HTTP 200
  - http://localhost:3003/api/health -> `{"status":"ok",...}`
- Riesgo de seguridad/dependencias visto en build Docker:
  - frontend `npm ci`: 10 vulnerabilidades reportadas por npm audit (1 low, 3 moderate, 5 high, 1 critical).
  - backend runtime `npm ci --omit=dev`: 2 moderate.
  - backend builder `npm ci`: 3 vulnerabilidades (1 low, 2 moderate).
  - npm advierte que `multer@1.x` esta impactado por vulnerabilidades y recomienda migrar a 2.x.

### Repo / codigo

- El repo React/Node compila, pero aun no es una replica exacta del HTML v6.
- El layout React actual usa:
  - Header: `70px` (`Header.tsx`)
  - Sidebar: `220px` (`Sidebar.tsx`)
  - Main margin top: `70px`; margin left: `220px` (`Layout.tsx`)
- La vision del CRM fija paridad HTML en:
  - Header: `60px`
  - Sidebar: `200px`
  - Densidad/formularios del HTML v6
- `Registro.tsx` conserva `max-w-4xl mx-auto`, lo que estrecha la pantalla y contradice la tarea tipica ya marcada para Codex: quitar max-width para acercarse al HTML.
- `tailwind.config.js` usa `DM Sans` / `DM Mono`, mientras la referencia de paridad en `VISION-CRM.md` dice Barlow / Barlow Condensed.
- `index.css` ya contiene un primer puente parcial con clases `html-*` para dashboard, pero no es una importacion completa ni sistematica del CSS del monolito.
- Hay muchos cambios no mios ya existentes en git status; no los toque ni los reverti.

### HTML vs React (angulo Codex)

El HTML manda. El React actual tiene avances parciales en Dashboard, pero la paridad visual/layout sigue incompleta.

Brechas concretas:

- Medidas base no coinciden: React 70/220 vs HTML esperado 60/200.
- Registro no esta a ancho/densidad HTML por `max-w-4xl`, `card p-6` y grillas Tailwind genericas.
- CSS del HTML esta portado parcialmente como `html-stat-card`, `html-chart-card`, `html-stats-row`, etc., pero falta una capa global `html-v6.css` o equivalente que concentre tokens y clases de referencia.
- Tipografia inconsistente con paridad documentada: React usa DM Sans; HTML esperado usa Barlow / Barlow Condensed.
- Componentes aun usan mezcla Tailwind/React propia (`card`, `input`, `btn`, `rounded-xl`, `bg-surface`) en vez de clonar nombres/valores visuales del HTML.
- Dashboard React usa Recharts y datos backend, pero debe verificarse visualmente contra `renderDashboard.js`, `renderBillingDashboard.js`, `renderCotDashboard.js`, `drawCharts.js`.
- Flujo Registro implementa buena parte del comportamiento, pero debe alinearse con `page-registro.html`, `saveRecord.js`, `buildServiceChips.js`, `renderContactosList.js`, `renderBillingLines.js`, `clearForm.js`.

Clases/estructuras HTML v6 que Codex deberia portar o mapear con precision:

- Layout: `app-container`, `top-header`, `sidebar`, `main-content`, `page`, `page.active`.
- Formularios: `form-grid`, `form-section`, `form-group`, `form-label`, `form-input`, `form-select`, `form-textarea`.
- Registro: `type-btn`, `service-chip`, `contact-card`, `billing-line`, `billing-total`, `section-tipo-cliente`.
- Dashboard/tablas: `stats-row`, `stat-card`, `stat-label`, `stat-value`, `stat-sub`, `charts-grid`, `chart-card`, `chart-title`, `chart-wrap`, `table-card`, `table-header`, `table-title`, `filter-input`, `filter-select`, `stag`.
- Estados/badges: clases de `estadoBadge.js` y badges de cotizaciones/visitas/facturacion.
- Modales/wizard/cotizaciones: pendiente de inventario CSS antes de tocar.

---

## 3. Hallazgos principales

1. El build esta verde en npm y Docker, pero hay advertencias relevantes de bundle grande y vulnerabilidades npm.
2. La brecha mas directa para Codex es de layout base: header/sidebar/padding no coinciden con HTML v6.
3. `Registro.tsx` sigue limitado por `max-w-4xl`, asi que nunca va a verse como el monolito aunque los campos existan.
4. La tipografia documentada de paridad (Barlow / Barlow Condensed) no coincide con la configuracion actual (DM Sans / DM Mono).
5. La estrategia CSS actual es parcial: hay clases `html-*` para Dashboard, pero falta portar sistematicamente los estilos y nombres clave del HTML.

---

## 4. Riesgos / bloqueos

| Bloqueo | Severidad | Quien deberia resolverlo |
|---------|-----------|--------------------------|
| Vulnerabilidades npm reportadas en Docker, incluida 1 critical en frontend | HIGH | @CODEX + @CLAUDE, con aval porque puede implicar upgrades |
| `multer@1.x` vulnerable/deprecated en backend | HIGH | @CLAUDE / @CODEX backend |
| Layout base React no coincide con medidas HTML | HIGH | @CODEX |
| Tipografia React no coincide con Barlow/Barlow Condensed de la vision | MEDIUM | @CODEX |
| Falta auditoria visual completa modulo por modulo con Agent Browser/screenshots | MEDIUM | @CODEX + @CURSOR |
| Repo con muchos cambios previos no mios | MEDIUM | @CURSOR lider debe coordinar ownership antes de ejecucion |

---

## 5. Propuesta de tareas para mi (borrador)

> El lider (Cursor) consolidara esto en TAREAS-SPRINT.md. No ejecutar hasta aval.

- [ ] Crear/portar `frontend/src/styles/html-v6.css` o equivalente minimo, importado una sola vez, con tokens y clases reales del HTML v6.
- [ ] Ajustar layout base a paridad: header 60px, sidebar 200px, main offsets/padding iguales al HTML.
- [ ] Quitar `max-w-4xl` de Registro y alinear `form-grid`, secciones, botones de tipo, service chips, contact cards y billing blocks contra `page-registro.html`.
- [ ] Unificar tipografia a Barlow / Barlow Condensed si el lider confirma que la vision prevalece sobre la regla estetica antigua DM Sans.
- [ ] Completar port de clases Dashboard sin cambiar logica: `stats-row/stat-card/chart-card/table-card/filter-*` con medidas/colores del HTML.
- [ ] Ejecutar smoke visual con Agent Browser despues de cada ajuste aprobado: login, dashboard, registro, responsive basico.
- [ ] Revisar `npm audit` y proponer upgrades seguros, especialmente `multer`, sin aplicar hasta aval.

---

## 6. Propuesta de tareas para otros agentes

- **@CLAUDE:** comparar funcionalidad profunda de Registro/CRM/Cotizaciones contra JS extraido; validar campos, payloads y flujos que no sean solo CSS.
- **@CURSOR:** consolidar ownership porque el repo ya tiene muchos cambios previos; definir si Barlow reemplaza DM Sans en todo el sistema.
- **@MINIMAX:** tareas pequenas no Docker: labels/textos, badges puntuales, microajustes aislados documentados por el lider.

---

## 7. Listo para ejecucion

- [x] Informe completo - el humano puede volver al lider.
- [x] No implemente codigo de producto.
- [x] Pare aqui hasta que el humano diga: "Ejecuta lo que tenga tu nombre".

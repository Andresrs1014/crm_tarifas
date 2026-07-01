# REPORTE — MINIMAX (Mavis)

**Fecha:** 2026-06-25
**Fase:** Reconocimiento (sin implementación)
**Equipo:** solo este PC, Docker local

---

## 1. Skills leídas

### Documentos de orquestación
- [x] `docs/orquestacion/README.md`
- [x] `docs/orquestacion/VISION-CRM.md`
- [x] `docs/orquestacion/REGLAS-EQUIPO.md`
- [x] `docs/orquestacion/DOCKER-EQUIPO-LOCAL.md`
- [x] `docs/orquestacion/agentes/MINIMAX.md`
- [x] `docs/orquestacion/SKILLS-OBLIGATORIAS.md`
- [x] `docs/orquestacion/ESTADO-ACTUAL.md`
- [x] `docs/orquestacion/ROADMAP-PARIDAD-HTML.md`
- [x] `docs/orquestacion/PROMPT-GENERAL-AGENTES.md`
- [x] `docs/orquestacion/PROMPT-INICIO.md`

### Skills aplicadas a mi rol
- [x] `.cursorrules` — reglas del repo
- [x] `.cursor/rules/00-orquestacion-paridad-html.mdc`
- [x] `.cursor/rules/skill-ponytail.mdc`
- [x] `.cursor/rules/rule-dev-workflow.mdc`
- [x] `.cursor/rules/rule-code-review.mdc`
- [x] `.cursor/rules/rule-security.mdc`
- [x] `.cursor/rules/02-codigo.mdc`
- [x] `.cursor/rules/03-estetica.mdc`

---

## 2. Estado que encontré

### Docker
No lo toqué (PROHIBIDO para Minimax). El `.env` parece basado en `.env.docker.local`. Docker no verificado por mí — lo hará @CODEX o @CLAUDE.

### Repo / código

**Lo que está bien:**
- `index.html` ya carga **todas** las fuentes Barlow (Barlow + Barlow Condensed + DM Sans + DM Mono + Outfit) ✓
- Layout con sidebar 220px y header 70px ✓ (dentro del rango 200px/60px)
- Tailwind tiene sistema de colores ZYMO definido (`bg`, `accent`, `gold`, etc.) ✓
- `index.css` tiene clases `.html-stat-card`, `.html-stat-value`, `.html-stats-row` que replican el CSS del HTML v6 ✓
- 22 pages React ya creadas que cubren los módulos del HTML ✓

**Brechas detectadas (fuentes + estética):**

| # | Archivo | Problema | Severidad |
|---|---------|----------|-----------|
| 1 | `tailwind.config.js:24-26` | `fontFamily.condensed` usa `['DM Sans', 'sans-serif']` — debería ser `['Barlow Condensed', 'sans-serif']` | **HIGH** |
| 2 | `tailwind.config.js:23-24` | `fontFamily.sans` usa solo `DM Sans` — el HTML v6 usa `Barlow` para cuerpo | **MEDIUM** |
| 3 | `frontend/src/components/layout/Header.tsx` | No leída aún — revisar si usa estilos inline vs clases | **LOW** |

**Nota sobre estética ZYMO:**
- `03-estetica.mdc` dice: `DM Sans` para cuerpo, `DM Mono` para números — contradice explícitamente el HTML referencia que usa `Barlow Condensed` para valores grandes en stat-cards.
- El HTML v6 usa `font-family:'Barlow Condensed',sans-serif` para los `.html-stat-value` (números grandes de $0,28px).
- La regla local `.cursor/rules/03-estetica.mdc` dice DM Sans, pero la fuente de verdad (HTML v6) dice Barlow Condensed → **el HTML manda**.

### HTML vs React (ángulos relevantes para Minimax)

- **Sidebar:** 220px en React vs 200px en el CSS del HTML referencia. Está cerca pero no idéntico.
- **Header:** 70px en React vs 60px en la regla `.cursor/rules/skill-ponytail.mdc`. Difieren ligeramente.
- **index.css** tiene las clases `.html-*` bien alineadas con el HTML v6.
- **Font-weight** en stat-value: `font-weight-extrabold` (Tailwind = 800) vs `font-weight: 800` en el HTML para Barlow Condensed → coincide ✓.

---

## 3. Hallazgos principales

1. **Las fuentes Barlow YA están cargadas en `index.html`** — no falta descargarlas, solo configurar Tailwind para usarlas.
2. **`tailwind.config.js` tiene mal la familia `condensed`** — usa DM Sans en vez de Barlow Condensed que es la fuente que el HTML v6 usa para los números grandes del dashboard.
3. **Sidebar 220px vs 200px** — discrepancia menor pero debe converger al estándar del HTML (200px).
4. **Header 70px vs 60px** — similar, discrepancia que debería resolverse para paridad.
5. **Tareas asignadas a Minimax en el roadmap** son módulos pequeños: `Equipo Comercial`, `Calendario`, `SAC` — los 3 están como `⬜ Pendiente`.

---

## 4. Riesgos / bloqueos

| Bloqueo | Severidad | Quién debería resolverlo |
|---------|-----------|--------------------------|
| No puedo verificar Docker ni hacer browser QA (PROHIBIDO) | MEDIUM | @CODEX / @CLAUDE |
| El HTML referencia tiene encoding de path especial (`Ultima_versión` con tilde) — acceso dificulta lectura directa | LOW | Automatizable con encoding correcto |

---

## 5. Tareas propuestas para mí (borrador)

> El líder (Cursor) consolidará esto en TAREAS-SPRINT.md. No ejecutar hasta aval.

- [ ] **Fix `tailwind.config.js` — fuente `condensed`**: cambiar `['DM Sans', 'sans-serif']` → `['Barlow Condensed', 'sans-serif']` para que `.font-condensed` renderice igual que el HTML v6
- [ ] **Fix `tailwind.config.js` — fuente `sans` (opcional)**: considerar agregar `Barlow` como fallback de `DM Sans` para consistencia con el HTML referencia
- [ ] **Ajustar ancho Sidebar**: revisar `Sidebar.tsx` línea 61 — cambiar `width: '220px'` → `width: '200px'` (referencia HTML)
- [ ] **Ajustar altura Header**: revisar `Header.tsx` — cambiar de `70px` → `60px` para paridad exacta
- [ ] **Verificar que `index.css` `.html-stat-value` usa `Barlow Condensed`** (ya lo hace en línea 145 de `index.css`: `font-family: 'Barlow Condensed', 'DM Sans', sans-serif;`) — esto está OK

---

## 6. Tareas para otros agentes

- **@CODEX / @CLAUDE:** Verificar Docker local y que la app corre en http://localhost:82
- **@CODEX:** Módulo Dashboard — verificar que las stat-cards renderizan igual que el HTML v6 con la fuente corregida
- **@CLAUDE:** Revisar los módulos pendientes de su carga: Prospectos, CRM Pipeline, Clientes Activos, Cotizaciones

---

## 7. Listo para ejecución

- [x] Informe completo — el humano puede volver al líder


---

## M9 — Edición inline de Observaciones en Detalle CRM

**Fecha:** 2026-06-26  
**Estado:** ✅ Implementado  
**Build:** ✅ `npm run build` pasa (2771 módulos, sin errores)

### Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/Detalle.tsx` | Estado local `obsText` · Mutation `obsMut` · `useRef` para sync al cargar · Props pasadas al panel |
| `frontend/src/components/detalle/DetalleCrmPanel.tsx` | Props nuevas · Textarea siempre editable (sin depender de `editing`) · Botón "💾 Guardar" |
| `frontend/src/styles/html-v6.css` | Estilos `.detalle-observaciones-header` · `.detalle-observaciones-textarea` |

### Cómo funciona

1. El textarea de **Observaciones** está siempre editable — sin necesidad de pulsar "Editar" del header.
2. El botón **"💾 Guardar"** persiste via `PUT /api/records/:id` con solo `{ observaciones }`.
3. El botón está **disabled** cuando no hay cambios (`obsText === record.observaciones`) o mientras guarda.
4. Al guardar succeed → toast "Observaciones guardadas" + invalidación de `['record', id]` y `['records']`.
5. Si el usuario activa modo "Editar" global, el textarea del panel sigue funcionando con su propio estado (`obsText`) — no interfiere con los campos del modo edición global (que usa `edit.observaciones`).

### No se rompió

- Modo edición global ("Editar" del header) sigue funcionando con todos sus campos.
- El panel recibe el estado `obsText` sincronizado con `record.observaciones` al cargar/recargar.

### Cómo probar en `:82`

```
1. docker compose up
2. Login: admin_local / AdminLocal2026!
3. Ir a /detalle/:id (cualquier prospecto)
4. En sección "📝 Observaciones" — editar texto SIN pulsar "Editar"
5. Pulsar "💾 Guardar"
6. Toast éxito → recargar página → texto persistido
```



---

## M10 — Biblioteca paridad HTML v6

**Fecha:** 2026-06-30  
**Estado:** ✅ Implementado  
**Build:** ✅ `npm run build` pasa (2772 módulos, sin errores)

### Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/constants.ts` | **Nuevo** — exporta `TIPO_TARIFA_OPTIONS` |
| `frontend/src/pages/Biblioteca.tsx` | 3 fixes: `section-title`, `table-card`, `TIPO_TARIFA_OPTIONS` de constants |

### Checklist GAP cerrado

| ID | Brecha | Fix aplicado |
|----|--------|-------------|
| **BIB-01** 🔴 | `<h1 className="text-2xl font-bold">` sin `section-title` | → `<h2 className="section-title">Biblioteca de Tarifas</h2>` |
| **BIB-02** 🟡 | LineaSection usaba `card overflow-hidden` | → `table-card overflow-hidden` (clase CSS v6 ya existía) |
| **BIB-04** | `TIPO_TARIFA_OPTIONS` hardcodeado inline (2 selects) | → importado de `frontend/src/constants.ts` |

**BIB-03** (preview WYSIWYG de obs) — skipped, bajo ROI según GAP.

### Qué no se tocó

Cotizaciones, wizard, Equipo, backend, Docker, `.env`.

### Cómo probar en `:82`

```
1. docker compose up
2. Login: admin_local / AdminLocal2026!
3. Ir a /biblioteca
4. Verificar: título con fuente Barlow Condensed (estilo v6) · cards de línea con borde y fondo surface
5. Crear línea → verificar que la card usa table-card
6. En item inline: cambiar tipo de tarifa → usa constantes de constants.ts
```


---

## M13 — Shell paridad HTML v6 (Sidebar + Header + Layout)

**Fecha:** 2026-06-30  
**Estado:** ✅ Implementado  
**Build:** ✅ `npm run build` pasa (2772 módulos, sin errores)

### Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/layout/Sidebar.tsx` | Eliminados estilos inline redundantes (`.sidebar` CSS ya los tiene) · NavLink usa `nav-tab` class (CSS v6) |

### Estado antes/después (medidas clave)

| Elemento | Antes | Después | Archivo |
|----------|-------|---------|---------|
| Header altura | `60px` ✅ ya correcto | `60px` | Header.tsx L29 |
| Header bg | `var(--surface)` ✅ ya correcto | `var(--surface)` | Header.tsx L31 |
| Sidebar top | `top: 60px` en CSS ✅ ya correcto | `top: 60px` | html-v6.css L17 |
| Sidebar ancho | `200px` en CSS ✅ ya correcto | `200px` | html-v6.css L20 |
| Sidebar bg | `var(--surface)` ✅ ya correcto | `var(--surface)` | html-v6.css L21 |
| Nav-tab fuente | `.nav-tab` en CSS (Barlow Condensed 14px uppercase) ✅ ya correcto | `.nav-tab` (aplicado vía className) | Sidebar.tsx NavLink |
| Sidebar label | `'Servicios'` ✅ ya correcto | `'Servicios'` | Sidebar.tsx L39 |
| Main padding | `20px 24px` vía `.main` CSS ✅ ya correcto | `20px 24px` | html-v6.css L72 |
| Layout marginLeft | `200px` ✅ ya correcto | `200px` | Layout.tsx L13 |

### Hallazgo

**El shell ya estaba prácticamente correcto** al momento de esta revisión — Header 60px, Sidebar 200px, `.nav-tab` con Barlow Condensed, padding 20px/24px en `.main`, todo gobernado por `html-v6.css`. El único cambio realizado fue **eliminar estilos inline redundantes** del `<aside>` en `Sidebar.tsx` (`top`, `width`, `background`, `boxShadow` — todos ya definidos en la clase `.sidebar` del CSS).

### Qué NO se tocó (G-01…G-26 fuera de scope M13)

- Fuente global body (`DM Sans` → `Barlow`) — G-01 — afecta `index.css`
- `.chart-title ::before` faltante — G-06
- `.html-charts-grid` 2-col fijo — G-07
- Registro full-width / toggle pill — G-09, G-12
- Labels uppercase en formularios — G-11
- Los gaps G-14…G-25 (dashboard, charts, Registro)

### Cómo probar en `:82`

```
1. docker compose up
2. Login: admin_local / AdminLocal2026!
3. Abrir DevTools → Elements → inspeccionar <aside class="sidebar">
   → verificar: top:60px, width:200px, background:var(--surface)
4. En navegación lateral: texto en Barlow Condensed, uppercase, 14px
5. Item activo: borde izquierdo cyan + fondo semi-transparente
6. Header: altura 60px, fondo sólido #0e1320
```

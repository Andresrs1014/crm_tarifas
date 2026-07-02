# GAP: CRM Pipeline — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C6)  
**Referencia HTML:** `page-crm` + `page-crm-detalle`  
**React:** `frontend/src/pages/CRMKanban.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## 1. Layout de página

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `.main { max-width:100%; padding-right:0 }` — sin padding derecho para que el kanban llene | `p-6 space-y-5` (padding 24px todos lados) | ❌ HTML elimina padding-right para que board llegue al borde; React pone 24px en todos lados | 🔴 |
| section-title | `<div class="section-title" style="margin-bottom:0">🗂️ CRM <span>Pipeline de Prospectos</span></div>` | `<h1 class="text-2xl font-bold">🗂️ CRM Pipeline</h1>` | ❌ falta `.section-title`; subtítulo diferente | 🔴 |
| Header layout | `display:flex justify-between` — section-title + [filtros + botón] en la misma fila | `flex items-center justify-between flex-wrap gap-3` con h1 + descripción + filtros | ✅ estructura similar | 🟢 |

---

## 2. Filtros del header

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Filter comercial | `filter-select min-width:190px` "👥 Todos los comerciales" | `filter-select` "👥 Todos los comerciales" | ✅ | 🟢 |
| Filter compañía | `filter-select` "🏢 Todas las compañías" — opciones: Logimat, IMC Depósito, IMC Cargo, Aduana | `filter-select` "🏢 Todas las compañías" — opciones: logimat, depósito, cargo, aduana (valores distintos) | ❌ valores de opción diferentes (case + nombre) — no filtran igual | 🔴 |
| Buscador | **AUSENTE** en HTML | `filter-input min-w-48` "Buscar empresa..." | React añade búsqueda extra — mejora aceptable | 🟢 |
| Botón Nuevo | `.btn .btn-primary .btn-sm` "➕ Nuevo Prospecto" — `onclick="showPage('registro')"` | `<Link to="/registro" class="btn-primary btn-sm">➕ Nuevo Prospecto</Link>` | ✅ | 🟢 |

---

## 3. KPI strip

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Grid | `grid auto-fit minmax(130px,1fr) gap:10px mb:16px` — div sin clase extra | `grid grid-cols-2 sm:grid-cols-5 gap-3` usando clase `card` | ❌ HTML no usa `.card` (tiene borde propio); React añade `bg-surface rounded-xl border` de card | 🟡 |
| KPI min-width | `minmax(130px)` — más compacto | `grid-cols-2 sm:grid-cols-5` — colapsa a 2 cols en móvil | aceptable | 🟢 |
| KPI values | Valores calculados via JS: total, enPipeline, facturados, perdidos, ingresosEsperados | mismos 5 KPIs | ✅ funcional | 🟢 |
| KPI top border | `border-top: 3px solid color` inline | `style={{ borderTop: '3px solid color' }}` | ✅ | 🟢 |
| KPI label fuente | Calcular via JS renderCRM — no extraíble directamente | `text-2xs text-muted uppercase tracking-widest font-bold` | probable match | 🟢 |
| KPI value fuente | Barlow Condensed (inferido de renderCRM) | `font-bold text-2xl Barlow Condensed` inline style | ✅ | 🟢 |

---

## 4. Banner visitas vencidas

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| BG/border | `rgba(248,113,113,0.1)` / `rgba(248,113,113,0.4) border-radius:10px padding:14px 18px mb:16px` | `rounded-xl border-danger/40 bg-danger/5 px-4 py-3` | padding 14→12px; rounded-xl (12px) vs 10px | 🟢 |
| Ícono | En HTML renderizado via JS | `⚠` texto + `text-danger text-lg` | ✅ | 🟢 |
| Contenido | Lista de empresas vencidas | Lista de empresas vencidas (máx 5 + "y N más") | ✅ | 🟢 |

---

## 5. Kanban Board

### 5.1 Contenedor

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Board wrapper | `display:flex gap:12px overflow-x:auto padding-bottom:28px scrollbar-width:none` | `flex gap-4 overflow-x-auto pb-4` — scrollbar visible | ❌ gap 16→12px; scrollbar visible en React (HTML lo oculta); pb-4=16px vs 28px | 🟡 |
| Scroll track fijo | `position:fixed bottom:0 left:200px right:0 height:18px` sincronizado con board — barra proxy personalizada | **AUSENTE** — usa scrollbar nativo del browser | 🟡 (UX diferente) |
| Ocultar scrollbar nativo | `scrollbar-width:none; -ms-overflow-style:none` + `::-webkit-scrollbar{display:none}` | No aplicado | 🟡 |

### 5.2 Columnas

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Renderizado | JS dinámico via `renderCRM()` — sin clase fija visible en HTML | `flex flex-col rounded-xl border min-h-[400px] w-56 flex-shrink-0` | React usa `rounded-xl` (12px); HTML posiblemente `border-radius:10px` via JS | 🟢 |
| Ancho columna | Inferido JS — similar a 224px | `w-56` = 224px | ✅ | 🟢 |
| Min height | JS | `min-h-[400px]` | OK | 🟢 |
| Color borde/bg hover | JS `stage.color` | `isOver ? stage.bg : '#0d1b2a'` | ✅ | 🟢 |
| Header label | JS: Barlow Condensed uppercase + count badge | `text-xs font-bold uppercase tracking-widest` + count badge | ✅ | 🟢 |
| Total ingresos | JS calcula y muestra | `text-2xs text-muted font-mono` | ✅ | 🟢 |

### 5.3 Cards kanban

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Card class | JS — usa `.card` o div inline | `.card p-3 space-y-1.5` | ✅ | 🟢 |
| Empresa | JS `font-weight:700` | `text-sm font-semibold truncate` | ✅ | 🟢 |
| Ciudad | JS | `text-2xs text-muted` | ✅ | 🟢 |
| Comercial | JS | `text-2xs text-muted/70` | ✅ | 🟢 |
| Servicios tags | `.stag` max 2 + overflow | `.stag` max 2 + overflow | ✅ | 🟢 |
| Ingresos esperados | JS `font-family:Barlow Condensed color:gold` | `text-2xs font-mono text-success` | ❌ color success (verde) vs gold; fuente mono vs Barlow Condensed | 🟡 |
| Próx. seguimiento | JS con color rojo si vencido | `text-2xs font-mono text-danger/text-muted` | ✅ | 🟢 |
| Drag & drop | No tenía — HTML era click para abrir detalle | dnd-kit drag and drop | React añade funcionalidad extra | 🟢 |

---

## 6. Detalle CRM (page-crm-detalle en HTML → React: modal inline en Detalle.tsx)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Apertura | `showPage('page-crm-detalle')` — nueva página completa | `navigate('/detalle/:id')` — ruta separada | ✅ equivalente | 🟢 |
| Pipeline stages bar | Fila de botones con fondo color por estado — `display:flex gap:0 overflow:hidden border:1px solid border border-radius:8px` | (en `Detalle.tsx`) | Ver GAP-DETALLE cuando se cree | — |
| Info grid | `grid 1fr 1fr gap:32px` con campos label+valor 120px | (en `Detalle.tsx`) | — | — |
| Actividades | Form + lista dentro del detalle | API actividades separada | Ver `Detalle.tsx` | — |

---

## 7. Anti-hardcode

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `STAGES` array (6 etapas con value, label, color, bg) | `CRMKanban.tsx` L18–25 | `frontend/src/lib/htmlV6/constants.ts` | Mover — Codex X7 puede importarlo |
| `ESTADOS_ACTIVOS` array | `CRMKanban.tsx` L196 **Y** `Dashboard.tsx` | `constants.ts` | **Deduplicar ahora** — mismos 5 valores en 2 lugares |
| Compañías filtro (Logimat, IMC Depósito, IMC Cargo, Aduana) | `CRMKanban.tsx` L252–256 **Y** `Clientes.tsx` L109–113 | `constants.ts` como `COMPANIAS_FILTER` | Deduplicar — valores distintos entre CRM y Clientes hoy |
| `fmt()` función | `CRMKanban.tsx` L27–30 | `utils/fmt.ts` | Extraer compartido |

---

## 8. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| CR-01 | Wrapper padding-right:0 ausente — kanban no llega al borde derecho | Cambiar wrapper a `style={{ paddingRight: 0 }}` ó quitar `p-6` en main, aplicar solo padding izquierdo |
| CR-02 | section-title no aplicado | `<div className="section-title" style={{marginBottom:0}}>🗂️ CRM <span>Pipeline de Prospectos</span></div>` |
| CR-03 | Compañías filtro con valores distintos al HTML | Alinear opciones a: "Logimat", "IMC Depósito", "IMC Cargo", "Aduana" (como HTML) |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| CR-04 | Board gap 16px → 12px | `gap-3` en vez de `gap-4` |
| CR-05 | Scrollbar nativo visible — HTML lo oculta | Añadir `[&::-webkit-scrollbar]:hidden` o clase Tailwind |
| CR-06 | Fixed scroll track ausente | Opcional — mejora UX. Si se añade: `position:fixed bottom:0 left:200px right:0` |
| CR-07 | KPI usa `card` class — HTML usa div plain | Cambiar a `div` con solo `border-top:3px` (sin bg extra de card) |
| CR-08 | Ingresos card: `text-success` (verde) → debe ser `text-gold` | Cambiar color |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| CR-09 | `STAGES` hardcoded | Mover a `constants.ts` |
| CR-10 | `ESTADOS_ACTIVOS` duplicado en Dashboard + CRM | Extraer a `constants.ts`, importar en ambos |
| CR-11 | Compañías hardcoded en CRM y Clientes con valores diferentes | Crear `COMPANIAS_FILTER` en `constants.ts`, usar en ambos |
| CR-12 | `fmt()` duplicada 3 veces | Extraer a `utils/fmt.ts` |

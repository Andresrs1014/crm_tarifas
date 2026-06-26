# GAP: Dashboard + Registro — HTML v6 vs React

**Generado:** 2026-06-25 por Claude Code (tarea C2)  
**Referencia:** `Ultima_versión/seguimiento-zymo-v6 (88).html`  
**React analizado:** `frontend/src/pages/Dashboard.tsx`, `Registro.tsx`, `Layout.tsx`, `Header.tsx`, `Sidebar.tsx`, `index.css`

Severidad: 🔴 ALTA (usuario nota diferencia) · 🟡 MEDIA · 🟢 BAJA (pixel-level)

---

## 0. Layout Shell (afecta todos los módulos)

| Elemento | HTML v6 | React actual | Delta | Severidad |
|----------|---------|--------------|-------|-----------|
| Header alto | `height: 60px` | `h-[70px]` | +10px | 🔴 |
| Header background | `var(--surface)` = `#0e1320` | `linear-gradient(135deg, #0d1626…)` | distinto | 🟡 |
| Sidebar top | `top: 60px` | `top: 70px` (correcto vs header) | relativo OK | 🟢 |
| Sidebar ancho | `width: 200px` | `width: 220px` | +20px | 🔴 |
| Sidebar background | `var(--surface)` = `#0e1320` | `#111827` | distinto | 🟡 |
| Sidebar padding | `padding: 8px 0 24px` | `pb-6` (24px) | ~OK | 🟢 |
| Nav-tab fuente | `Barlow Condensed` 14px 600 uppercase | `text-sm` (DM Sans) | ❌ fuente | 🔴 |
| Nav-tab padding | `padding: 11px 20px` | `px-5 py-2.5` = 10px 20px | -1px top | 🟢 |
| Nav-tab gap icono | `gap: 10px` | `gap-2.5` = 10px | ✅ | 🟢 |
| Sidebar label fuente | `font-size: 10px`, `letter-spacing: 2px` | `text-2xs` tracking-[2px] | ✅ | 🟢 |
| Main margin-left | `margin-left: 200px` | `marginLeft: 220px` | matches sidebar | 🟢 |
| Main padding | `.main { padding: 20px 24px }` | `p-7` = 28px | +8px top/bot, +4px lat. | 🟡 |
| Body font | `'Barlow', sans-serif` | `'DM Sans', sans-serif` (html layer) | ❌ fuente global | 🔴 |
| Background global | `#080c14` (var(--bg)) | `bg-bg` (mismo valor en Tailwind) | ✅ | 🟢 |

**Correcciones críticas en Layout Shell:**
1. Header: bajar a 60px y simplificar background a `var(--surface)` sólido
2. Sidebar: reducir a 200px, cambiar bg a `#0e1320`, nav-tab fuente → Barlow Condensed
3. `index.css` body → `font-family: 'Barlow', sans-serif`
4. Layout main: `padding: 20px 24px` (bajar de 28px)

---

## 1. Dashboard

### 1.1 Filtros (barra superior)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper | `display:flex align-items:center justify-content:space-between flex-wrap gap:12px mb:24px` | `flex flex-wrap items-center justify-between gap-3 mb-6` | ~equivalente | 🟢 |
| Label "Filtros:" | `font-size:11px color:text2 letter-spacing:1.5px uppercase font-weight:600` | `text-[11px] uppercase tracking-[1.5px] text-muted font-semibold` | ✅ | 🟢 |
| Select filtros | `.filter-select { padding:8px 14px font-size:13px min-width:190px }` | `.input min-w-[190px] py-2 text-sm` | input vs filter-select | 🟡 |
| Exportar Excel btn | `.btn btn-secondary btn-sm border-accent color-accent` | `btn-secondary btn-sm text-xs border-accent text-accent` | ✅ | 🟢 |

### 1.2 Banner de filtros activos

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| BG | `rgba(0,194,255,0.08)` | `bg-accent/10` ≈ 0.10 | +0.02 | 🟢 |
| Border | `rgba(0,194,255,0.3)` | `border-accent/30` = 0.30 | ✅ | 🟢 |
| Border-radius | `10px` | `rounded-[10px]` | ✅ | 🟢 |
| Padding | `12px 20px` | `px-5 py-3` = 12px 20px | ✅ | 🟢 |
| Cuenta registros | `color:text2 font-weight:400 font-size:12px` | `text-xs font-normal text-muted` | ✅ | 🟢 |

### 1.3 Stats Row (KPIs)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Grid class | `.stats-row` | `.html-stats-row` | renombrada | 🟢 |
| Grid cols | `auto-fit minmax(160px, 1fr) gap:16px mb:28px` | `auto-fit minmax(160px, 1fr) gap-4 mb-7` | ✅ | 🟢 |
| Card class | `.stat-card` | `.html-stat-card` | renombrada | 🟢 |
| Card padding | `20px` | `p-5` = 20px | ✅ | 🟢 |
| Card border-radius | `12px` | `rounded-xl` = 12px | ✅ | 🟢 |
| Card hover | `translateY(-2px)` | `hover:-translate-y-0.5` = -2px | ✅ | 🟢 |
| Top bar `::before` | `height:3px` color por tono | `h-[3px]` color por tono | ✅ | 🟢 |
| Label fuente | `11px text2 letter-spacing:1.5px uppercase mb:8px` | `text-[11px] uppercase tracking-[1.5px] text-muted mb-2` | ✅ | 🟢 |
| Value fuente | `Barlow Condensed 38px 800 line-height:1` | `font-family: Barlow Condensed 38px font-extrabold` | ✅ | 🟢 |
| Sub fuente | `12px text2 mt:4px` | `text-xs text-muted mt-1` | ✅ | 🟢 |

### 1.4 Charts Grid (primer bloque 4 gráficas)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Grid class | `.charts-grid { grid-template-columns: 1fr 1fr }` | `.html-charts-grid { auto-fit minmax(280px, 1fr) }` | ❌ HTML es 2-col fijo, React es auto-responsive 4-col en pantallas grandes | 🔴 |
| Grid gap | `gap: 20px mb: 28px` | `gap-5 mb-5` = 20px 20px | -8px bottom | 🟡 |
| Card class | `.chart-card { bg:surface border border-radius:12px padding:24px }` | `.html-chart-card { rounded-xl border border-border bg-surface p-5 }` = 20px | -4px padding | 🟡 |
| Chart title fuente | `Barlow Condensed 700 15px uppercase letter-spacing:1.5px color:text2 mb:20px` | `.html-chart-title text-sm font-semibold text-foreground mb-4` | ❌ fuente incorrecta, sin uppercase, mb diferente | 🔴 |
| Chart title `::before` | `content:'' width:4px height:16px bg:accent border-radius:2px` | **AUSENTE** | ❌ falta barra decorativa | 🔴 |
| Chart wrap altura | `height: 240px` | `html-chart-wrap: h-[220px]` | -20px | 🟡 |

### 1.5 Facturación por Línea

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper card | `.chart-card mb:20px` | `.html-chart-card mb-5` | ✅ | 🟢 |
| Sub-label | `11px text2 uppercase tracking:1.5px mb:14px` | `text-[11px] uppercase tracking-[1.5px] text-muted mb-3.5` | ✅ | 🟢 |
| Total font | `Barlow Condensed 28px 800 color:gold` | `text-[28px] font-extrabold text-gold Barlow Condensed` | ✅ | 🟢 |
| Pie donut height | `height: 200px` | `h-[200px]` | ✅ | 🟢 |

### 1.6 Cotizaciones Section

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Stats row cot | `.stats-row` 4 cards | `.html-stats-row mb-4` | ✅ | 🟢 |
| Charts grid cot | `grid-template-columns: 1fr 1fr` | `html-charts-grid style={{ gridTemplateColumns: '1fr 1fr' }}` | ✅ (inline override) | 🟢 |
| Tabla title | `.table-title: Barlow Condensed 700 16px uppercase letter-spacing:1.5px` | `.table-title: font-bold text-sm tracking-widest uppercase` | ❌ fuente, font-size (14px vs 16px) | 🟡 |
| Tabla overflow | `overflow: visible` (en .table-card) | `overflow-hidden` | diferencia scroll lateral | 🟡 |

### 1.7 Timeline + Gestión + Últimos Registros

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Charts grid | `grid-template-columns: 2fr 1fr` | `style={{ gridTemplateColumns: '2fr 1fr' }}` | ✅ (inline) | 🟢 |
| Últimos registros tabla | 6 columnas: Empresa, Tipo, Comercial, Servicios, Estado, Fecha | mismas 6 columnas | ✅ | 🟢 |
| service-tags wrap | `.service-tags { display:flex flex-wrap:wrap gap:6px }` + `.stag` | `.html-stag` en Dashboard, `.stag` en tabla | OK | 🟢 |

---

## 2. Registro (Nuevo Registro)

### 2.1 Contenedor y sección principal

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Page wrapper | `.main { padding: 20px 24px }` sin max-width | `p-6 max-w-4xl mx-auto` = centrado, máx 56rem | ❌ HTML es full-width | 🔴 |
| Form card | `.form-card { bg:surface border border-radius:12px padding:28px mb:28px }` | `card p-6` = bg-surface border rounded-xl padding:24px | -4px padding | 🟡 |
| section-title fuente | `Barlow Condensed 800 24px uppercase letter-spacing:2px` + `span { color:accent }` | `section-title text-2xl font-bold mb-6` + `text-accent` | ❌ fuente incorrecta, sin uppercase | 🔴 |

### 2.2 Toggle Tipo (Prospecto / Cliente)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper | `.type-toggle { display:flex gap:0 border-radius:8px overflow:hidden border:1px solid border }` | `flex gap-2` (gap entre botones) | ❌ HTML es pill unificado sin gap | 🔴 |
| Botón fuente | `Barlow Condensed 600 14px uppercase letter-spacing:1px` | `font-semibold text-sm` | ❌ fuente | 🔴 |
| Prospecto activo | `bg: rgba(0,194,255,0.15) color: accent` | `bg-accent/15 border-accent text-accent` | ~OK | 🟢 |
| Cliente activo | `bg: rgba(0,230,118,0.15) color: green` | `bg-success/15 border-success text-success` | ✅ | 🟢 |

### 2.3 Datos Básicos

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Grid | `.form-grid { auto-fit minmax(220px, 1fr) gap:16px }` | `grid grid-cols-1 sm:grid-cols-2 gap-4` | diferente: HTML auto-fit, React fixed 2-col | 🟡 |
| Labels | `font-size:11px color:text2 letter-spacing:1.5px text-transform:uppercase font-weight:600` | `block text-xs text-muted mb-1` sin uppercase, sin tracking | ❌ falta uppercase y tracking | 🔴 |
| Input padding | `10px 14px` | `.input: px-3 py-2.5` = 10px 12px | -2px lat. | 🟢 |
| Dirección | `.modal-col-full { grid-column: 1/-1 }` | `sm:col-span-2` | ✅ equivalente | 🟢 |

### 2.4 Clasificación Cliente

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper | sin card extra | `rounded-lg border border-border p-4` | HTML más flat (solo section-header + form-grid) | 🟡 |
| Sub-header fuente | `Barlow Condensed 14px 700 uppercase letter-spacing:1.5px color:accent` | `text-sm font-bold uppercase tracking-wider text-accent` | ❌ fuente | 🟡 |

### 2.5 Contactos

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Card wrapper contacto | sección flat dentro del form-card | `rounded-xl border border-border bg-surface2 p-4` por contacto | HTML es más plano, React agrega card extra | 🟡 |
| Encabezado sección | `label Barlow Condensed 14px 700 uppercase letter-spacing:1.5px` | `text-sm font-bold uppercase tracking-wider` | ❌ fuente | 🟡 |
| Grid interna | `.form-grid auto-fit minmax(220px, 1fr)` | `grid-cols-1 sm:grid-cols-2 gap-3` | similar | 🟢 |
| Labels | 11px uppercase tracking como resto del form | `text-xs text-muted mb-1` sin uppercase | ❌ | 🔴 |

### 2.6 Servicios de Interés

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Label sección | `label 11px uppercase tracking:1.5px text2 600` | `text-sm font-medium` sin uppercase | ❌ | 🟡 |
| Chip wrapper | `.service-chip { padding:8px 14px font-size:13px border-radius:8px }` | `px-3 py-1.5 rounded-lg text-sm` = 6px 12px | menor padding vertical | 🟡 |
| Chip seleccionado | `.service-chip.selected { bg:rgba(0,194,255,0.12) border:accent color:accent }` | `bg-accent/15 border-accent text-accent` | ✅ | 🟢 |

### 2.7 Sección Prospecto

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Grid campos | `.form-grid auto-fit minmax(220px, 1fr)` | `grid-cols-1 sm:grid-cols-2 gap-4` | 🟡 |
| Labels | 11px uppercase tracking text2 600 | `text-xs text-muted mb-1` sin uppercase | ❌ | 🔴 |
| Ingresos preview | `Barlow Condensed 20px 800 color:gold mt:4px` | `text-xl font-extrabold text-gold Barlow Condensed` | ✅ | 🟢 |
| Billing block | `rgba(245,166,35,0.06) border rgba(245,166,35,0.2) border-radius:10px padding:18px` | `rounded-[10px] border-gold/20 bg-gold/5 p-4` = 16px padding | -2px padding | 🟢 |
| Billing sub-header | `Barlow Condensed 14px 700 uppercase` | `text-sm font-bold uppercase tracking-wider` | ❌ fuente | 🟡 |
| Billing total | `Barlow Condensed 24px 800 color:gold` | `text-2xl font-extrabold text-gold Barlow Condensed` | ✅ | 🟢 |

### 2.8 Sección Cliente

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Sub-header | `Barlow Condensed 16px 700 uppercase letter-spacing:1.5px color:green mb:16px pb:10px border-bottom` | `(no extraído aún)` | pendiente verificar | — |
| Grid | mismo `.form-grid` | `grid-cols-1 sm:grid-cols-2 gap-4` | 🟡 |
| Nuevo servicio condicional | `display:block/none` | conditional render | OK funcional | 🟢 |
| Billing block | mismo que prospecto | mismo | ✅ | 🟢 |

### 2.9 Botones de acción

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper | `display:flex gap:12px justify-content:flex-end padding-top:20px border-top` | (pendiente verificar) | — | — |
| Btn Limpiar | `.btn btn-secondary` Barlow Condensed uppercase | `btn-secondary` | fuente | 🟡 |
| Btn Guardar | `.btn btn-primary` Barlow Condensed uppercase | `btn-primary` | fuente | 🟡 |

---

## 3. Resumen de brechas por prioridad

### 🔴 ALTA — Correcciones que el usuario nota inmediatamente

| ID | Brecha | Archivo afectado |
|----|--------|-----------------|
| G-01 | Fuente global `DM Sans` → debe ser `Barlow` | `index.css` line 7 |
| G-02 | Header 70px → debe ser 60px | `Header.tsx` line 29 |
| G-03 | Sidebar 220px → debe ser 200px | `Sidebar.tsx` line 63 + `Layout.tsx` |
| G-04 | Sidebar bg `#111827` → debe ser `#0e1320` | `Sidebar.tsx` line 64 |
| G-05 | Nav-tab fuente DM Sans → Barlow Condensed 14px uppercase | `Sidebar.tsx` NavLink className |
| G-06 | `.chart-title` / `.html-chart-title` falta `::before` barra cyan (4px×16px) | `index.css` |
| G-07 | `.html-charts-grid` usa `auto-fit minmax(280px)` → debe ser `1fr 1fr` fijo | `index.css` |
| G-08 | `.chart-title` fuente → Barlow Condensed 15px uppercase text2 | `index.css` |
| G-09 | Registro: `max-w-4xl mx-auto` → full-width (igual que HTML) | `Registro.tsx` line 243 |
| G-10 | `section-title` fuente → Barlow Condensed 800 24px uppercase | `index.css` |
| G-11 | Labels de formulario → 11px uppercase tracking-1.5px text2 font-600 | `index.css` y `Registro.tsx` |
| G-12 | type-toggle → pill unificado sin gap, connected borders | `Registro.tsx` / `index.css` |
| G-13 | Nav-tab fuente incompleta (ya en sidebar, pero falta aplicar) | `Sidebar.tsx` |

### 🟡 MEDIA — Visibles en comparación lado a lado

| ID | Brecha | Archivo afectado |
|----|--------|-----------------|
| G-14 | `.html-chart-card` padding 20px → debe ser 24px | `index.css` |
| G-15 | `.html-chart-wrap` altura 220px → debe ser 240px | `index.css` |
| G-16 | `.table-title` fuente → Barlow Condensed 16px uppercase | `index.css` |
| G-17 | `.table-card` overflow: visible (no overflow-hidden) | `index.css` |
| G-18 | Main `p-7` (28px) → debe ser `padding: 20px 24px` | `Layout.tsx` |
| G-19 | Chips de servicios padding (6px→8px vertical) | `Registro.tsx` chip class |
| G-20 | `.form-grid` en Registro → `auto-fit minmax(220px, 1fr)` en lugar de 2-col fijo | `Registro.tsx` |
| G-21 | Botones principales fuente → Barlow Condensed uppercase | `index.css` .btn |

### 🔴 ALTA — Hallazgo nuevo (QA visual C4)

| ID | Brecha | Archivo afectado |
|----|--------|-----------------|
| G-26 | Filtros Dashboard apilados verticalmente (full-width) → deben ser inline horizontales. Causa: `.input` tiene `w-full`. Fix: cambiar a `.filter-select` en los 3 selects | `Dashboard.tsx` L141, L150, L160 |

### 🟢 BAJA — Solo perceptible en pixel-diff

| ID | Brecha |
|----|--------|
| G-22 | Sidebar `padding: 8px 0 24px` → React `pb-6` (falta top 8px) |
| G-23 | Banner bg 0.08 vs 0.10 |
| G-24 | Chart grid mb 28px → 20px |
| G-25 | Input lateral padding 14px vs 12px |

---

## 4. Archivos a tocar (Codex/Cursor)

| Archivo | Cambios |
|---------|---------|
| `frontend/src/index.css` | G-01, G-06, G-07, G-08, G-10, G-11, G-14, G-15, G-16, G-17, G-21 |
| `frontend/src/components/layout/Header.tsx` | G-02 |
| `frontend/src/components/layout/Sidebar.tsx` | G-03, G-04, G-05, G-13 |
| `frontend/src/components/layout/Layout.tsx` | G-03 (marginLeft 220→200), G-18 |
| `frontend/src/pages/Registro.tsx` | G-09, G-12, G-19, G-20 |

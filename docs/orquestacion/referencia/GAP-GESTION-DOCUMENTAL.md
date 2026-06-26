# GAP: Gestión Documental (BASC) — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C11b)  
**Referencia HTML:** `page-gestion-documental`  
**React:** `pages/GestionDocumental.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## Estado Cursor 2026-06 (ya implementado)

✅ 18 documentos gestionados desde `GD_DOCS` (import API — no hardcoded)  
✅ % cumplimiento calculado por empresa (docs completados / total)  
✅ Filtros: búsqueda, tipo (directo/indirecto/referido), compañía, % cumplimiento, vencimiento, estado  
✅ KPI strip: `grid-cols-4` con totales por estado  
✅ DocModal: slide-in desde la derecha, sticky header, compliance bar, ciclo selector  
✅ Mass actions en DocModal: seleccionar todos, cambiar estado, guardar  
✅ Cálculo vencimiento: ciclo FR-001-GC + 1 año ✅  
✅ Export Excel via XLSX ✅  
✅ Alertas banners (vencidos pronto, sin ciclo asignado)  
✅ Compañías filter: Logimat, IMC Depósito, IMC Cargo, Aduana ✅ (4 opciones completas)

---

## 1. Layout y estructura

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` | `className="p-6 space-y-5"` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Gestión Documental</h2>` | `<h1 className="text-xl font-display font-bold">Gestión Documental</h1>` | ❌ Falta `section-title` · usa `font-display` | 🔴 |
| Subtítulo | `BASC · 18 documentos · Solo clientes activos` | `<p className="text-sm text-gray-400">BASC · 18 documentos · Solo clientes activos</p>` | ✅ | 🟢 |
| Botón Excel | `<button class="btn-secondary">⬇ Excel</button>` | `<button className="btn-secondary">Excel</button>` icono `FileSpreadsheet` | ✅ funciona, texto sin "⬇" | 🟢 |
| Alertas banners | HTML: alertas inline al top | `{alerts.length > 0 && <div className="...">}` banner | ✅ | 🟢 |

---

## 2. KPI Strip

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Estructura | `grid-cols-4` cards con borde superior color | `grid grid-cols-4 gap-3` con `card-glass rounded-xl` | ⚠️ usa `card-glass`, no `card` + border-top | 🟡 |
| Datos | Total clientes, Con cumplimiento 100%, Por vencer, Vencidos | mismos 4 | ✅ | 🟢 |

---

## 3. Filtros

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Búsqueda | `.filter-input` | inline styles `px-3 py-1.5 bg-surface border border-border rounded-lg` | ❌ no usa `.filter-input` | 🟡 |
| Tipo cliente | `.filter-select` (directo / indirecto / referido) | inline styles | ❌ no usa `.filter-select` | 🟡 |
| Compañía | `.filter-select` 4 opciones | 4 opciones hardcoded (Logimat, IMC Depósito, IMC Cargo, Aduana) | ⚠️ hardcode — Aduana ✅ presente | 🟡 |
| % Cumplimiento | `.filter-select` (3 buckets) | inline styles | ❌ no usa `.filter-select` | 🟡 |
| Vencimiento | `.filter-select` (4 opciones) | inline styles | ❌ no usa `.filter-select` | 🟡 |
| Estado | `.filter-select` | inline styles | ❌ no usa `.filter-select` | 🟡 |

---

## 4. Tabla principal

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `<div class="table-card">` | `<div className="card-glass rounded-xl border border-border overflow-x-auto">` | ❌ no usa `table-card` | 🟡 |
| Columnas | Empresa, Tipo, Compañías, Ciclo, % Cumpl., Estado docs, Últ. Act., Próx. Act., Días p/Vencer, Status | mismas | ✅ | 🟢 |
| Progress bar cumplimiento | barra verde en celda | `<div>` con width porcentual y color | ✅ | 🟢 |
| Badge estado docs | `.stag` | `ESTADO_STYLE` hardcoded → texto coloreado | ⚠️ hardcode · no usa `.stag` | 🟡 |
| Badge vencimiento | `.stag` color semáforo | `VENC_STYLE` hardcoded → texto coloreado | ⚠️ hardcode · no usa `.stag` | 🟡 |
| Botón abrir DocModal | `Ver documentos` / ícono | `<button>Ver</button>` abre DocModal | ✅ | 🟢 |

---

## 5. DocModal (slide-in derecho)

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Animación | slide desde derecha | `fixed inset-0` con `w-full max-w-2xl ml-auto` | ✅ equivalente | 🟢 |
| Header sticky | empresa + badge + % cumplimiento | sticky `div` con empresa, badge estado y % | ✅ | 🟢 |
| Barra cumplimiento | barra con porcentaje | `<div>` width porcentual | ✅ | 🟢 |
| Selector ciclo | select año del ciclo FR-001-GC | `select` año con opciones generadas | ✅ | 🟢 |
| Lista documentos | 18 docs: checkbox + select estado + fecha + obs | misma estructura | ✅ | 🟢 |
| Mass actions | "Seleccionar todos" + apply estado a selección | `selectAll` + `massSave` | ✅ | 🟢 |
| Guardar | save fila o mass save | `saveMut` por empresa | ✅ | 🟢 |
| Cerrar | ✕ o click backdrop | ✕ button + `onClick backdrop` | ✅ | 🟢 |

---

## 6. Anti-hardcode

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `ESTADO_STYLE` (colores texto por estado) | `GestionDocumental.tsx` L9-13 | `domainConfig.ts` | Mover — afecta badges tabla |
| `VENC_STYLE` (colores semáforo vencimiento) | `GestionDocumental.tsx` L15-20 | `domainConfig.ts` | Mover — afecta badges tabla |
| Compañías filter `['Logimat', 'IMC Depósito', 'IMC Cargo', 'Aduana']` | inline en filtro | `COMPANIAS_FILTER` de constants | Unificar con constante compartida |
| `GD_DOCS` | API import ✅ — ya extraído | — | ✅ no acción |

---

## 7. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| GD-01 | `section-title` ausente | `<h2 className="section-title">Gestión Documental</h2>` |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| GD-02 | 6 filtros no usan `.filter-input` / `.filter-select` | Reemplazar estilos inline por clases HTML v6 |
| GD-03 | Tabla usa `card-glass` en vez de `table-card` | Cambiar a `table-card overflow-x-auto` |
| GD-04 | KPI usa `card-glass` — inconsistente con patrón `card` + border-top | Uniformizar |
| GD-05 | Badges de estado/vencimiento no usan `.stag` | Usar `<span className="stag ...">` con colores de domainConfig |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| GD-06 | `ESTADO_STYLE` hardcoded | Mover a `domainConfig.ts` |
| GD-07 | `VENC_STYLE` hardcoded | Mover a `domainConfig.ts` |
| GD-08 | Compañías hardcoded en filtro | Importar de `COMPANIAS_FILTER` en constants |

---

## 8. Checklist Codex X12b (GestionDocumental)

- [ ] Cambiar `h1 font-display` a `<h2 className="section-title">Gestión Documental</h2>`
- [ ] Cambiar todos los filtros inline a `.filter-input` y `.filter-select`
- [ ] Cambiar wrapper tabla de `card-glass` a `table-card overflow-x-auto`
- [ ] Cambiar badges tabla a `<span className="stag">` usando colores de domainConfig
- [ ] Mover `ESTADO_STYLE` a `domainConfig.ts`
- [ ] Mover `VENC_STYLE` a `domainConfig.ts`
- [ ] Importar compañías filter desde `COMPANIAS_FILTER` de constants

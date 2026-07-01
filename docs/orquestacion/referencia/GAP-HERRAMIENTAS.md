# GAP: Herramientas comerciales — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C12)  
**Secciones:** Preliquidador · Cotizador Paqueteo · Fichas SOP (Lista + Detalle)  
**Referencia HTML:** `page-preliquidador`, `page-cotizador`, `page-ficha-cliente`, `page-ficha-detalle`  
**React:** `Preliquidador.tsx` · `CotizadorPaqueteo.tsx` · `FichaCliente.tsx` · `FichaDetalle.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## Sección H1 — Preliquidador

### Estado Cursor 2026-06

✅ Búsqueda cotizaciones (combobox empresa + número + líneas)  
✅ Selección items por checkbox (grupados por línea → grupo)  
✅ Formulario dinámico Paso 2 (campos detectados por nombre: CIF, peso, tipo, pallets, unidades)  
✅ `calcPreliq()` con lógica MAX(calculado, mínima) para 5 tipos de cálculo  
✅ Historial de preliquidaciones guardado en API  
✅ `SVC_COLORS` importado de domainConfig ✅  
✅ Print result table vía `window.print()`

### Layout y estructura

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` | `className="p-6 space-y-5"` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Preliquidador</h2>` | `<h1 className="text-xl font-display font-bold">Preliquidador</h1>` | ❌ Falta `section-title` | 🔴 |
| Container | card o div principal | `card-glass` para el tool | ⚠️ `card-glass` vs `table-card` | 🟡 |

### Proceso 3 pasos

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Paso 1: búsqueda cot | autocomplete por empresa/número | combobox `<input>` + lista resultados filtrada | ✅ | 🟢 |
| Paso 1: selección items | checkboxes agrupados | acordeón línea → grupo → item | ✅ | 🟢 |
| Paso 2: form dinámico | campos aparecen según items | `needCif`, `needPeso`, etc. detectados de nombres items | ✅ | 🟢 |
| Paso 3: tabla resultado | Concepto, Base cálculo, Nota, Valor COP | mismas columnas | ✅ | 🟢 |
| Paso 3: total | suma de todos los conceptos | `totalCOP` calculado | ✅ | 🟢 |
| Print | `window.print()` con estilos de impresión | `<button onClick={() => window.print()}>` | ✅ | 🟢 |

### Motor de cálculo `calcPreliq()`

| Tipo cálculo | HTML v6 | React | Delta | Sev |
|-------------|---------|-------|-------|-----|
| Ad valorem | `% × CIF`, `MAX(calc, mínima por tipo/contenedor)` | mismo | ✅ | 🟢 |
| Seguro | `% × CIF`, `MAX(calc, mínima)` | mismo | ✅ | 🟢 |
| Pallet | `qty × tarifa`, `MAX(calc, mínima)` | mismo | ✅ | 🟢 |
| Por kg | `peso × tarifa/kg`, `MAX(calc, mínima)` | mismo | ✅ | 🟢 |
| Manipulación | `fija × contenedores` | mismo | ✅ | 🟢 |
| Despacho | `fija × unidades` | mismo | ✅ | 🟢 |

### Historial

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Guardar | HTML no tenía historial persistente | POST API `/preliq-historial` | React mejora vs HTML | 🟢 |
| Lista | — | tabla historial + load + delete | ✅ | 🟢 |
| Autosave | — | auto-save al calcular | ✅ | 🟢 |

### Anti-hardcode Preliquidador

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `SVC_COLORS` | domainConfig import ✅ | — | ✅ no acción |
| Tipos de contenedor para mínimas (20', 40', LCL) | hardcoded en `calcPreliq()` | `constants.ts` | Extraer |

---

## Sección H2 — Cotizador Paqueteo

### Estado Cursor 2026-06

✅ Formulario: origen (dpto+mpio), destino (dpto+mpio), tamaño, peso, valor declarado  
✅ 3 mensajerías: Coordinadora, TCC, Servientrega con tarifas por zona  
✅ Peso cobrable = `MAX(peso_real, peso_volumetrico)`  
✅ Tabla resultados usa `table-card` ✅  
✅ Gold gradient card header con Barlow Condensed

### Layout y estructura

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` centrado max-width | `max-w-3xl mx-auto` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Cotizador Paqueteo</h2>` | `<h1 className="text-2xl font-bold">📦 Cotizador Paqueteo</h1>` (emoji) | ❌ Falta `section-title` · usa emoji | 🔴 |
| Card formulario | `card-glass` con header dorado | gold gradient inline + Barlow Condensed inline style | ⚠️ estilos inline en vez de clases | 🟡 |
| Tabs tamaño | "Estándar" / "Personalizado" | tabs con estado local | ✅ | 🟢 |
| Resultados | `table-card` | ✅ usa `table-card` | ✅ | 🟢 |

### Anti-hardcode Cotizador

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `COURIERS` (tarifas Coordinadora, TCC, Servientrega) | `CotizadorPaqueteo.tsx` L54-91 | `constants.ts` | Mover — son datos de dominio configurables |
| `COL_DEPTS` (todos los dptosymunicipios de Colombia) | `CotizadorPaqueteo.tsx` L6-39 | `constants.ts` | Mover — objeto grande, no lógica |
| `ZONA1`, `ZONA2` (arrays de depts por zona) | `CotizadorPaqueteo.tsx` L93-94 | `constants.ts` | Mover |
| `SIZES` (tamaños estándar) | `CotizadorPaqueteo.tsx` L102-107 | `constants.ts` | Mover |
| Gold gradient style inline | header card | CSS class o `card-gold` | Refactor menor |

---

## Sección H3 — Fichas SOP (Lista y Detalle)

### Estado Cursor 2026-06

**FichaCliente.tsx:**  
✅ Lista con KPI strip 5 columnas  
✅ Filtros: `filter-input` ✅, `filter-select` ✅  
✅ `table-card` ✅  
✅ Progress bar por fila  
✅ `getAnalistas` pre-warms cache

**FichaDetalle.tsx:**  
✅ 5 tabs: Info General, Contactos, Facturación, Operación, Kick Off  
✅ Sticky header con botón Volver + Guardar  
✅ Progress bar % completitud (23 campos verificados)  
✅ `table-card` en tabs Contactos y Kick Off ✅  
✅ Analistas CRUD  
✅ Conexión con pipeline: `creacion_sop` → get-or-create ficha  
✅ Barlow Condensed via `font-display` + inline styles

### Layout FichaCliente

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` | `className="p-6 space-y-5"` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Fichas de Cliente</h2>` | `<h1 className="text-2xl font-bold">📋 Fichas de Cliente</h1>` (emoji) | ❌ Falta `section-title` · emoji en header | 🔴 |
| KPI cards | `card` + border-top color | `card` + `borderTop: color` inline | ✅ patrón correcto, borderTop inline | 🟢 |
| Filtros | `.filter-input`, `.filter-select` | mismas clases ✅ | ✅ | 🟢 |
| Tabla | `table-card` | ✅ | ✅ | 🟢 |
| Progress bar fila | barra coloreada % | `div width: X%` con color | ✅ | 🟢 |

### Layout FichaDetalle

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Header sticky | empresa + botón Volver + Guardar | sticky `div` con empresa + acciones | ✅ | 🟢 |
| Progress bar header | % completitud con barra | `div` width porcentual | ✅ | 🟢 |
| Tabs 5 | Info General, Contactos, Facturación, Operación, Kick Off | mismos 5 tabs con estado local | ✅ | 🟢 |
| `section-title` | ninguno interno — tabs son títulos | ninguno | ✅ consistente | 🟢 |
| `table-card` | en Contactos y Kick Off | ✅ | ✅ | 🟢 |
| Analistas | lista de analistas por ficha | CRUD + `getAnalistas` query | ✅ | 🟢 |
| Conexión pipeline | `creacion_sop` stage crea ficha | backend `/ficha-get-or-create` | ✅ | 🟢 |

### Anti-hardcode FichaDetalle

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `ESTADO_BADGE`, `ESTADO_LABEL` | `FichaCliente.tsx` L7-16 | `domainConfig.ts` (estados de ficha) | Mover |
| `MANEJO_OPTIONS` | `FichaDetalle.tsx` L~20 | `constants.ts` | Mover |
| `SECTOR_OPTIONS` | `FichaDetalle.tsx` L~25 | `constants.ts` | Mover |
| `ALMACENAMIENTO_OPTIONS` | `FichaDetalle.tsx` L~30 | `constants.ts` | Mover |
| `FACTURACION_OPTIONS` | `FichaDetalle.tsx` L~35 | `constants.ts` | Mover |
| `PALLET_OPTIONS` | `FichaDetalle.tsx` L~40 | `constants.ts` | Mover |
| `FORMA_FACT_LG_OPTIONS` | `FichaDetalle.tsx` L~45 | `constants.ts` | Mover |
| `CANT_FACT_LG_OPTIONS` | `FichaDetalle.tsx` L~50 | `constants.ts` | Mover |
| `CANT_FACT_IC_OPTIONS` | `FichaDetalle.tsx` L~55 | `constants.ts` | Mover |
| `COMPROMISOS` (lista 23 campos) | `FichaDetalle.tsx` L~60 | `constants.ts` | Mover |
| Barlow Condensed inline style | múltiples lugares en FichaDetalle | `font-display` class (ya existe) | Reemplazar inline styles |

---

## Resumen de brechas globales (Herramientas)

### 🔴 ALTA

| ID | Brecha | Archivo | Fix |
|----|--------|---------|-----|
| H-01 | `section-title` ausente en Preliquidador | `Preliquidador.tsx` | `<h2 className="section-title">Preliquidador</h2>` |
| H-02 | `section-title` ausente en CotizadorPaqueteo | `CotizadorPaqueteo.tsx` | `<h2 className="section-title">Cotizador Paqueteo</h2>` (sin emoji) |
| H-03 | `section-title` ausente en FichaCliente | `FichaCliente.tsx` | `<h2 className="section-title">Fichas de Cliente</h2>` (sin emoji) |

### 🟡 MEDIA

| ID | Brecha | Archivo | Fix |
|----|--------|---------|-----|
| H-04 | Preliquidador usa `card-glass` en vez de `table-card` | `Preliquidador.tsx` | Cambiar wrapper a `table-card` |
| H-05 | Gold gradient inline en CotizadorPaqueteo | `CotizadorPaqueteo.tsx` | Extraer a clase CSS |
| H-06 | Barlow Condensed inline styles en FichaDetalle | `FichaDetalle.tsx` | Usar `font-display` class |

### Anti-hardcode

| ID | Brecha | Acción |
|----|--------|--------|
| H-07 | `COURIERS`, `COL_DEPTS`, `ZONA1/2`, `SIZES` en CotizadorPaqueteo | Mover a `constants.ts` |
| H-08 | `ESTADO_BADGE`/`ESTADO_LABEL` en FichaCliente | Mover a `domainConfig.ts` |
| H-09 | 9 arrays de opciones + `COMPROMISOS` en FichaDetalle | Mover todos a `constants.ts` |

---

## Checklist Codex X12c (Herramientas)

### Preliquidador
- [ ] `<h2 className="section-title">Preliquidador</h2>` reemplaza `h1 font-display`
- [ ] Cambiar wrapper tool de `card-glass` a `table-card`
- [ ] Extraer tipos de contenedor de `calcPreliq()` a `constants.ts`

### CotizadorPaqueteo
- [ ] `<h2 className="section-title">Cotizador Paqueteo</h2>` reemplaza `h1` con emoji
- [ ] Mover `COURIERS`, `COL_DEPTS`, `ZONA1`, `ZONA2`, `SIZES` a `constants.ts`
- [ ] Extraer gold gradient a clase CSS (`card-gold-header` o similar)

### FichaCliente
- [ ] `<h2 className="section-title">Fichas de Cliente</h2>` reemplaza `h1` con emoji
- [ ] Mover `ESTADO_BADGE`/`ESTADO_LABEL` a `domainConfig.ts`

### FichaDetalle
- [ ] Mover `MANEJO_OPTIONS`, `SECTOR_OPTIONS`, `ALMACENAMIENTO_OPTIONS`, `FACTURACION_OPTIONS`, `PALLET_OPTIONS`, `FORMA_FACT_LG_OPTIONS`, `CANT_FACT_LG_OPTIONS`, `CANT_FACT_IC_OPTIONS` a `constants.ts`
- [ ] Mover `COMPROMISOS` a `constants.ts`
- [ ] Reemplazar inline `fontFamily: 'Barlow Condensed'` por `font-display` class

---

## Estado post-C17

**Auditoría 2026-07-01 — Claude C17**

### Brechas actualizadas

| ID | Brecha | Estado post-C17 | Agente |
|----|--------|-----------------|--------|
| H-01 | Preliquidador `section-title` ausente | **✅ C16** | — |
| H-02 | CotizadorPaqueteo `section-title` + emoji | **✅ C16** | — |
| H-03 | FichaCliente `section-title` + emoji | **✅ C16** | — |
| H-04 | Preliquidador `card-glass` → `card` | **✅ C16** (→ `card`). Pendiente → `table-card` exacto | Codex X12 |
| H-05 | CotizadorPaqueteo gold gradient inline | 🟡 Abierto | Codex X12 |
| H-06 | FichaDetalle Barlow inline | 🟡 Abierto | Codex X12 |
| H-07 | `COURIERS`, `COL_DEPTS`, etc. inline | 🟡 Abierto | Codex X12 |
| H-08 | `ESTADO_BADGE/LABEL` FichaCliente inline | 🟡 Abierto | Codex X12 |
| H-09 | 9 arrays + `COMPROMISOS` en FichaDetalle | 🟡 Abierto | Codex X12 |
| **H-10** | **SAC: KPI strip (`crm-kpi-strip`)** | **✅ C16** | — |
| **H-11** | **Calendario: KPI strip + `filter-select`** | **✅ C16** | — |
| **MR-06** | **Export Excel MatrizRiesgos** | 🔴 Abierto — feature nueva, no presente en HTML v6 pero requerida | Cursor L5 |
| **FD-01** | **FichaDetalle: profundidad de campos por tab** | 🟡 Por auditar en :82 — 5 tabs implementados pero no verificados contra HTML `page-ficha-detalle` | Cursor QA |

### Nota FichaDetalle (FD-01)

El HTML `page-ficha-detalle` tiene 5 tabs: Info General, Contactos, Facturación, Operación, Kick Off. React los implementa. La brecha está en si los **campos de cada tab** son equivalentes. Requiere QA visual en :82 tab por tab antes de cerrar.

### Módulos con paridad visual completa (post-C16)

Preliquidador, CotizadorPaqueteo, FichaCliente, CalendarioVisitas, SAC — paridad visual ✅ por C16. Pendientes solo anti-hardcode y table-card exacto.

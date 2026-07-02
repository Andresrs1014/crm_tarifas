# GAP: Clientes Activos — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C7)  
**Referencia HTML:** `page-clientes`  
**React:** `frontend/src/pages/Clientes.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## 1. Estructura de página

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `.main { padding:20px 24px }` | `p-6 space-y-5` (L64) | p-6=24px ≈ 24px ✅; space-y-5 OK | 🟢 |
| section-title | `<div class="section-title">🏢 Clientes <span>Activos</span></div>` — Barlow Condensed 800 uppercase | `<h1 class="text-2xl font-bold">Clientes Activos</h1>` (L69) | ❌ falta `.section-title`; emoji ausente | 🔴 |
| Subtítulo | **AUSENTE** en HTML | `{clientes.length} clientes · {fmt(total)} facturado` (L71) | React añade dato extra — aceptable | 🟢 |
| Header layout | `display:flex justify-content:space-between align-items:center` | `flex items-center justify-between` (L67) | ✅ | 🟢 |

---

## 2. Botones de acción

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Exportar Excel | `.btn .btn-secondary .btn-sm` "⬇️ Exportar Excel" | `btn-secondary btn-sm` "↓ Excel" (L77) | label distinto, falta emoji ⬇️ | 🟡 |
| Carga Masiva | `.btn .btn-secondary .btn-sm` `style="border-color:#00e676;color:#00e676"` "📤 Carga Masiva" | **AUSENTE** | ❌ falta | 🟡 |
| Nuevo cliente | **AUSENTE** en header HTML — va dentro de `.table-header-2row` | `<Link className="btn-primary btn-sm">+ Nuevo cliente</Link>` (L84) | HTML no tiene "Nuevo" en header — lo pone en table-header | 🟡 |
| Ubicación botones | Dentro de `.table-header-2row` (fila 1 del card) | Fuera del `.table-card`, en header separado (L75-88) | ❌ ubicación diferente | 🔴 |

---

## 3. Table card y header

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Card class | `.table-card` | `.table-card` (L122) | ✅ | 🟢 |
| `.table-header-2row` | Presente — Fila 1: `.table-title` "Lista de Clientes" + botones (Excel, Carga Masiva, Nuevo); Fila 2: filtros | **AUSENTE** — header y filtros están fuera del card | ❌ estructura completa ausente | 🔴 |
| `.table-title` | `"Lista de Clientes"` — Barlow Condensed 700 16px uppercase, dentro del card | **AUSENTE** | ❌ | 🔴 |

---

## 4. Filtros

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper | `.table-filters { display:flex flex-wrap gap:8px }` — dentro de `.table-header-2row` | `flex flex-wrap gap-3` fuera del table-card (L91) | ubicación incorrecta; gap 12→8px | 🟡 |
| Búsqueda | `filter-input` "🔍 Buscar empresa o NIT..." | `filter-input flex-1 min-w-48` "Buscar empresa o NIT..." (L92-96) | falta emoji 🔍 | 🟢 |
| Estado | `filter-select` — opciones: Todos, activo, en-riesgo, inactivo | `filter-select` — opciones de `CLIENTE_ESTADO_OPTIONS` (L98) | ✅ (ya usa domainConfig) | 🟢 |
| Facturado | `filter-select` "Facturación: Todos / Facturado / No Facturado" | `filter-select` mismo contenido (L101) | ✅ | 🟢 |
| **Compañía (HTML)** | `filter-select` "🏢 Todas las compañías" — opciones: Logimat, IMC Depósito, IMC Cargo, Aduana | **AUSENTE** | ❌ HTML filtra por compañía operativa; React no tiene este filtro | 🔴 |
| **Línea de negocio (React)** | **AUSENTE** en HTML | `filter-select` "Todas las líneas" — Zona Franca, Depósito Aduanero, CEDI, Transporte, Paqueteo, Aduana (L106) | React tiene filtro de servicios extra — no en HTML | 🟡 |
| Comercial (React) | **AUSENTE** en HTML | `filter-select` "Todos los comerciales" (L115) | React añade filtro extra — mejora funcional | 🟢 |

> **Nota de decisión:** HTML filtra clientes por *compañía operativa* (Logimat, IMC Depósito, IMC Cargo, Aduana). React filtra por *línea de servicio* (categorías). Son dimensiones distintas. Para parity: reemplazar "Todas las líneas" por "Todas las compañías" con las 4 opciones de HTML. El filtro de comercial React puede mantenerse.

---

## 5. Columnas de tabla

| Col HTML v6 | Col React | Línea React | Delta | Sev |
|-------------|-----------|-------------|-------|-----|
| Empresa | Empresa + NIT sub | L139, L154 | ✅ | 🟢 |
| Contacto | Contacto + cargo sub | L140, L158 | ✅ | 🟢 |
| Comercial | Comercial | L141, L164 | ✅ | 🟢 |
| Servicios | Servicios (.stag max 2 + overflow) | L142, L166 | ✅ | 🟢 |
| Visita | Visita | L143, L175 | ✅ | 🟢 |
| Nuevo Servicio | Nuevo Servicio | L144, L181 | ✅ | 🟢 |
| Facturado | Facturación | L145, L187 | label "Facturado" → "Facturación" | 🟢 |
| Estado | Estado | L146, L195 | ✅ | 🟢 |
| — | **Cat.** (categoría) | L147-148 | ❌ columna extra no en HTML | 🟡 |
| Acciones | Acciones (Ver + ×) | L148, L210 | ✅ | 🟢 |

**Total HTML: 9 columnas · React: 10 columnas (Cat. extra)**

---

## 6. Celda Facturación

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Valor monetario | JS `font-family:Barlow Condensed color:gold` format `$XM/$XK` | `font-mono text-sm text-success` (L188) | ❌ color `text-success` (verde) → debe ser gold; fuente mono vs Barlow Condensed | 🟡 |
| Badge facturado | badge debajo del valor | `FACTURADO_BADGE` (L190) — ya en domainConfig | ✅ | 🟢 |

---

## 7. Anti-hardcode

| Valor | Dónde en React | Debería estar | Acción |
|-------|----------------|--------------|--------|
| `CATEGORIA_COLOR` (A→#f5a623, B→#00c2ff, C→#8899b4) | `Clientes.tsx` L12–16 | `frontend/src/lib/htmlV6/domainConfig.ts` o `constants.ts` | Mover — ya existe patrón con `CLIENTE_BADGE` en domainConfig |
| `fmt()` función | `Clientes.tsx` L18–22 (también en Prospectos.tsx L33, CRMKanban.tsx L27) | `frontend/src/utils/fmt.ts` | **Extraer compartido — 3 copias duplicadas** |
| Compañías filtro ("Logimat", "IMC Depósito", etc.) | **AUSENTE** en React (usa categorías de servicio) | `constants.ts` como `COMPANIAS_FILTER` (mismo que CRM) | Añadir filtro + centralizar opciones |
| Líneas de negocio (Zona Franca, Depósito Aduanero, CEDI, Transporte, Paqueteo, Aduana) | `Clientes.tsx` L108–113 | `constants.ts` como `LINEAS_NEGOCIO` | Mover — si se mantiene este filtro |

---

## 8. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| CL-01 | section-title ausente | `<div className="section-title">🏢 Clientes <span>Activos</span></div>` |
| CL-02 | `.table-header-2row` ausente — título+botones+filtros fuera del card | Mover todo dentro de `.table-card > .table-header-2row` |
| CL-03 | `.table-title "Lista de Clientes"` ausente | Añadir dentro del header |
| CL-04 | Botones fuera del table-card | Reorganizar dentro de `.table-header-2row` fila 1 |
| CL-05 | Filtro compañía ausente — React filtra por servicios, HTML por compañía | Reemplazar "Todas las líneas" por `filter-select` "🏢 Todas las compañías" con Logimat/IMC Depósito/IMC Cargo/Aduana |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| CL-06 | Botón "Carga Masiva" ausente | Añadir con `style="border-color:var(--green);color:var(--green)"` |
| CL-07 | Columna extra "Cat." no en HTML | Decidir: eliminar o mantener como mejora React |
| CL-08 | Valor monetario: `text-success` → debe ser gold (Barlow Condensed) | Cambiar a `text-gold font-barlow-condensed` |
| CL-09 | Botón Excel label "↓ Excel" → "⬇️ Exportar Excel" | Actualizar label |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| CL-10 | `CATEGORIA_COLOR` hardcoded | Mover a `domainConfig.ts` o `constants.ts` |
| CL-11 | `fmt()` duplicada (Clientes + Prospectos + CRM) | Extraer a `utils/fmt.ts` — importar en los 3 |
| CL-12 | Compañías filtro ausente (o hardcoded si se añade) | Crear `COMPANIAS_FILTER` en `constants.ts` |

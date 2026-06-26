# GAP: Prospectos — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C5)  
**Referencia HTML:** `page-prospectos`  
**React:** `frontend/src/pages/Prospectos.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## 1. Estructura de página

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `.main { padding:20px 24px }` | `p-6 space-y-5` | p-6=24px vs 20/24 | 🟢 |
| section-title | `<div class="section-title">🎯 <span>Prospectos</span></div>` Barlow Condensed 800 24px uppercase | `<h1 class="text-2xl font-bold">Prospectos</h1>` + subtítulo count | ❌ no usa `.section-title`, falta uppercase Barlow | 🔴 |
| Título texto | `🎯 Prospectos` (emoji en section-title) | `Prospectos` sin emoji, count en subtítulo | 🟡 |
| Botones header | "⬇️ Exportar Excel" + "📤 Carga Masiva" (dentro de table-header) | "↓ Excel" + "**+ Nuevo prospecto**" (fuera de table-card) | ❌ falta "Carga Masiva"; "Nuevo" no existe en HTML header | 🟡 |
| Pipeline bar | **AUSENTE** en HTML | `card p-4` con barra y leyenda | React añade elemento extra no en HTML — remover o mantener explícitamente | 🟡 |

---

## 2. Table card

### 2.1 Contenedor y header

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Card class | `.table-card` | `.table-card` | ✅ | 🟢 |
| Header layout | `.table-header-2row` — fila 1: título + botones; fila 2: filtros | Header plano fuera del table-card + filtros en flex row separado | ❌ estructura diferente: HTML embebe title/btn/filtros en el card | 🔴 |
| Título tabla | `.table-title` "Lista de Prospectos" — Barlow Condensed 700 16px uppercase | **AUSENTE** — no hay "Lista de Prospectos" dentro del table-card | ❌ falta `.table-title` | 🔴 |
| Botón Excel | `.btn .btn-secondary .btn-sm` "⬇️ Exportar Excel" | `btn-secondary btn-sm` "↓ Excel" | label distinto, falta emoji ⬇️ | 🟡 |
| Botón Carga Masiva | `.btn .btn-secondary .btn-sm` `border-color:#00e676; color:#00e676` "📤 Carga Masiva" | **AUSENTE** | ❌ falta | 🟡 |

### 2.2 Filtros

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Wrapper | `.table-filters { display:flex flex-wrap gap:8px }` dentro de `.table-header-2row` | `flex flex-wrap gap-3` fuera del table-card | ✅ orientación flex OK; ubicación distinta | 🟡 |
| Filter buscar | `filter-input` placeholder "🔍 Buscar empresa..." | `filter-input flex-1 min-w-48` placeholder "Buscar empresa..." | falta emoji 🔍 | 🟢 |
| Filter estado | `filter-select` 8 opciones incluyendo `frio` y `perdido` | `filter-select` 9 opciones (incluye vacío + todos) | ✅ opciones completas | 🟢 |
| Filter comercial | `filter-select` "Todos los comerciales" | `filter-select` "Todos los comerciales" | ✅ | 🟢 |
| Filter compañía | **AUSENTE** en Prospectos | **AUSENTE** | ✅ paridad OK | 🟢 |

### 2.3 Tabla

| Col HTML v6 | Col React | Delta | Sev |
|-------------|-----------|-------|-----|
| Empresa | Empresa + NIT sub | ✅ | 🟢 |
| Contacto | Contacto + cargo sub | ✅ | 🟢 |
| Comercial | Comercial | ✅ | 🟢 |
| Servicios | Servicios (`.stag`, max 2 + overflow) | ✅ | 🟢 |
| Estado | Estado badge | ✅ | 🟢 |
| Facturado | Facturado badge | ✅ | 🟢 |
| Próx. Seguimiento | Próx. Seguimiento (rojo si vencido) | ✅ | 🟢 |
| Acciones | Acciones (Ver + ×) | ✅ | 🟢 |

**Columnas: paridad completa ✅**

---

## 3. Anti-hardcode — constantes duplicadas

| Valor | Dónde está en React | Debería estar en | Acción |
|-------|---------------------|-----------------|--------|
| `ESTADOS` array (8 valores + label + badge) | `Prospectos.tsx` L10–20 | `frontend/src/lib/htmlV6/constants.ts` o `domainConfig.ts` | Mover — ya hay `CLIENTE_ESTADO_OPTIONS` en domainConfig; crear `PROSPECTO_ESTADO_OPTIONS` |
| `ESTADO_BADGE` map | `Prospectos.tsx` L22–31 | `domainConfig.ts` o `constants.ts` | Mover como `PROSPECTO_BADGE` |
| `colorMap` inline en pipeline bar | `Prospectos.tsx` L105–109 | Inline OK si pipeline bar se elimina; si se mantiene → `constants.ts` | |
| `fmt()` función | `Prospectos.tsx` L33–37 (duplicada en CRMKanban, Clientes) | `frontend/src/utils/fmt.ts` o `lib/htmlV6/format.ts` | **Extraer una vez, importar en todos** |

---

## 4. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| P-01 | section-title no usa `.section-title` (Barlow Condensed uppercase) | Usar `<div className="section-title">🎯 <span>Prospectos</span></div>` |
| P-02 | `.table-header-2row` ausente — título+botones+filtros no están dentro del table-card | Refactorizar layout: meter todo dentro de `.table-card > .table-header-2row` |
| P-03 | `.table-title "Lista de Prospectos"` ausente | Añadir `.table-title` dentro del header |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| P-04 | Pipeline bar extra (no en HTML) | Decidir: mantener como mejora React ó remover. Si se mantiene, extraer colores a constants |
| P-05 | Botón "Carga Masiva" ausente | Añadir `<button class="btn-secondary btn-sm" style="border-color:var(--green);color:var(--green)">📤 Carga Masiva</button>` (abre import modal) |
| P-06 | Botón Excel label "↓ Excel" → "⬇️ Exportar Excel" | Actualizar label |
| P-07 | Filtros fuera del table-card | Mover dentro de `.table-header-2row` |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| P-08 | `ESTADOS` hardcoded in file | Exportar de `domainConfig.ts` |
| P-09 | `ESTADO_BADGE` hardcoded | Exportar de `domainConfig.ts` |
| P-10 | `fmt()` duplicada | Extraer a util compartido |

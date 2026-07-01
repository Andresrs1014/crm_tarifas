# GAP: Biblioteca de Tarifas — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C10)  
**Referencia HTML:** `page-biblioteca`  
**React:** `pages/Biblioteca.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## Estado Cursor 2026-06 (ya implementado)

✅ Árbol 3 niveles: LineaSection → GrupoSection → ItemRow (expand/collapse)  
✅ CRUD inline: doble-clic para editar nombre, hover para añadir/eliminar  
✅ Columnas extra por línea (se incluyen en cotización como columnas dinámicas)  
✅ Observaciones predefinidas por línea (aparecen al pie del PDF de cotización)  
✅ Tipos de tarifa: `moneda` | `porcentaje` — diferencia el cálculo del wizard  
✅ Backend CRUD completo para líneas, grupos, ítems, columnas, observaciones

---

## 1. Layout y estructura

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` general del main | `className="p-6 space-y-5"` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Biblioteca de Tarifas</h2>` | `<h1 className="text-2xl font-bold">Biblioteca de Tarifas</h1>` | ❌ Falta `section-title` | 🔴 |
| Botón "Nueva Línea" | `<button class="btn-primary">+ Línea</button>` al lado del título | `<button className="btn-primary">+ Nueva línea</button>` | ✅ lógica · texto similar | 🟢 |
| Container líneas | lista de cards, una por línea | `space-y-5` de divs | ✅ | 🟢 |

---

## 2. Card por línea (LineaSection)

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Card wrapper | `<div class="table-card">` con header y cuerpo | `<div className="card overflow-hidden">` | ⚠️ usa `card` Tailwind, no `table-card` | 🟡 |
| Header línea | fondo `--surface` con nombre + tipo + expand + acciones | `div bg-surface/80 flex items-center` | ✅ equivalente | 🟢 |
| Nombre editable | doble-clic activa `<input>` inline | `dblclick` → `editingLineaId` state | ✅ | 🟢 |
| Badge tipo tarifa | badge diferenciado moneda/porcentaje | `<span>` con color según tipo | ✅ | 🟢 |
| Botón expandir | chevron gira al expandir | `ChevronDown` Lucide rota con `rotate-180` | ✅ | 🟢 |
| Botones acciones | Añadir grupo · Columnas extras · Obs. · Eliminar | mismos, con hover reveal | ✅ | 🟢 |

---

## 3. Grupos e ítems

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| GrupoSection | sub-header dentro de la línea con nombre + expand + añadir ítem | misma estructura | ✅ | 🟢 |
| Nombre grupo | editable inline doble-clic | misma mecánica | ✅ | 🟢 |
| ItemRow | fila con nombre, valor, tipo (heredado), notas | fila con mismo contenido | ✅ | 🟢 |
| Valor ítem | `$ 0` para moneda, `0%` para porcentaje | renderizado según `tipoTarifa` de la línea padre | ✅ | 🟢 |
| Notas ítem | campo de texto corto | `input.text-sm` | ✅ | 🟢 |
| Mínima por ítem | campo `mínima` (usado por Preliquidador MAX) | `input.text-sm` para `minima` | ✅ | 🟢 |
| CRUD | añadir/eliminar grupo e ítem | mutaciones API + optimistic update | ✅ | 🟢 |

---

## 4. Columnas extra por línea

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Propósito | columnas adicionales que aparecen en la tabla de cotización | `ColumnasSection` component | ✅ | 🟢 |
| Gestión | panel lateral o modal en HTML | sección desplegable debajo de la línea | ✅ funcional | 🟢 |
| Impacto cotización | snapshot incluye columnas extra | `columnasExtra` en snapshot de cotización | ✅ | 🟢 |

---

## 5. Observaciones predefinidas

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Propósito | texto/HTML que aparece al pie de cada sección del PDF | `ObsSection` component | ✅ | 🟢 |
| Editor | textarea con soporte HTML básico | `textarea` con rows=3 | ✅ | 🟢 |
| Múltiples obs | lista de observaciones por línea | array de obs, add/delete/reorder | ✅ | 🟢 |
| Preview | preview renderizado del HTML | ❌ no hay preview WYSIWYG | 🟡 |

---

## 6. Anti-hardcode

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `TIPO_TARIFA_OPTIONS` `['moneda', 'porcentaje']` | inline en select de Biblioteca.tsx L~85 | `constants.ts` | Mover |

> Biblioteca es uno de los módulos más limpios en cuanto a hardcode — solo el selector de tipo de tarifa necesita atención.

---

## 7. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| BIB-01 | `section-title` ausente | `<h2 className="section-title">Biblioteca de Tarifas</h2>` |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| BIB-02 | Cards de línea usan clase `card` Tailwind en vez de `table-card` | Cambiar a `table-card` para consistencia con HTML v6 |
| BIB-03 | Sin preview WYSIWYG de observaciones predefinidas | Añadir `<div dangerouslySetInnerHTML>` mini-preview (bajo ROI) |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| BIB-04 | `TIPO_TARIFA_OPTIONS` inline en select | Mover a `constants.ts` |

---

## 8. Checklist Codex X11 (Biblioteca)

- [ ] Añadir `<h2 className="section-title">Biblioteca de Tarifas</h2>` antes del container de líneas
- [ ] Cambiar `className="card overflow-hidden"` de LineaSection a `className="table-card overflow-hidden"`
- [ ] Extraer `TIPO_TARIFA_OPTIONS` a `constants.ts`
- [ ] (Opcional) Mini-preview de observaciones predefinidas usando `dangerouslySetInnerHTML`

---

## Estado post-C17

**Auditoría 2026-07-01 — Claude C17**

El GAP generado en C10 tenía como referencia solo las líneas estándar (Zona Franca, CEDI, Depósito). El HTML v6 tiene **tres renderizadores distintos** según el tipo de línea. Los gaps reales son más amplios que lo documentado originalmente.

### Brechas actualizadas

| ID | Brecha | HTML v6 | React actual | Sev | Agente |
|----|--------|---------|--------------|-----|--------|
| BIB-01 | `section-title` ausente | `<h2 class="section-title">` | ❌ | 🔴 | **✅ C16** |
| BIB-02 | Card línea usa `card` vs `table-card` | `.table-card` | `card overflow-hidden` | 🟡 | Codex X11 |
| BIB-03 | Sin preview WYSIWYG observaciones | mini-preview inline | ❌ | 🟢 | Codex X11 opcional |
| BIB-04 | `TIPO_TARIFA_OPTIONS` inline | `constants.ts` | inline en select | 🟢 | Codex X11 |
| **BIB-05** | **Línea Transporte: renderizador especial ausente** | `renderBibGrupoTransporte` con `TRANSP_SCHEMA` (local/otros), 2 botones "+ Nuevo grupo Transporte Local/Otros", celdas tarifa/tarifa-mixta/tarifa-texto con $+% toggle | ❌ React trata Transporte como línea estándar | 🔴 | Codex X11 |
| **BIB-06** | **Línea Paqueteo: tabs por paqueteadora ausentes** | `renderBibGrupoPaqueteo` con tabs COORDINADORA / TCC / SERVIENTREGA, grupos precargados de `PAQUETEO_SCHEMA`, `colspanGroups` en headers | ❌ React trata Paqueteo como línea estándar | 🔴 | Codex X11 |
| **BIB-07** | **Grupos son siempre visibles (no colapsables)** | `renderBibGrupo` genera tabla inline sin toggle. Solo la línea tiene toggle | Si React tiene grupos expand/collapse → divergencia | 🟡 | Codex X11 |
| **BIB-08** | **Renombrar col1/col2/col3 ausente** | Inputs de texto en panel columnas para renombrar "Servicio"/"Tarifa"/"Observaciones" | ❌ Sin UI para renombrar cabeceras | 🟡 | Codex X11 |
| **BIB-09** | **Observaciones "ricas" por línea** | `addBibObsRich` → textarea + preview HTML por obs; lista de obs por línea | Solo textarea sin preview ni múltiples obs | 🟡 | Codex X11 |

### Módulos cerrados por sesiones anteriores

| ID | Quién |
|----|-------|
| BIB-01 (`section-title`) | ✅ Claude C16 |

### Orden de implementación recomendado (Codex X11)

1. BIB-05 — Transporte (TRANSP_SCHEMA) → ver `SPEC-BIBLIOTECA-WIZARD.md § Transporte`
2. BIB-06 — Paqueteo (PAQUETEO_SCHEMA + tabs) → ver `SPEC-BIBLIOTECA-WIZARD.md § Paqueteo`
3. BIB-02 — table-card wrapper
4. BIB-07 — Confirmar grupos no colapsables
5. BIB-08 — Renombrar col1/col2/col3
6. BIB-04 — Mover TIPO_TARIFA_OPTIONS
7. BIB-09 — Obs ricas (opcional)

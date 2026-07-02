# GAP: Cotizaciones (lista + wizard + pública) — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C9)  
**Referencia HTML:** `page-cotizaciones`, `page-nueva-cot`, `page-cot-publica`, `page-actualizar-tarifas`  
**React:** `pages/Cotizaciones.tsx` · `pages/wizard/WizardLayout.tsx` · `pages/CotPublica.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## Estado Cursor 2026-06 (ya implementado)

✅ Lista con filtros (búsqueda, estado, comercial)  
✅ Tabla con todas las columnas principales  
✅ 8 acciones por fila (ver/editar, PDF, avanzar estado, rechazar, actualizar tarifas, copiar link, duplicar, eliminar)  
✅ Modal "Actualizar Tarifas" con preview de items + % increment → crea nueva cotización copia  
✅ Wizard 5 pasos: empresa+datos → líneas → items → observaciones → resumen  
✅ Modo edición del wizard via `useParams id`  
✅ `searchParams.get('recordId')` pre-rellena vínculo con prospecto/cliente  
✅ Vista pública `/cot/:numero` sin auth, delegada a `htmlPreview` del servidor  
✅ `COTIZACION_BADGE` + `COTIZACION_ESTADO_OPTIONS` importados de domainConfig

---

## 1. Layout: Página de Lista

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` del main | `p-6 space-y-5` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Cotizaciones</h2>` | `<h1 class="text-2xl font-bold">Cotizaciones</h1>` | ❌ Falta `section-title` | 🔴 |
| `.table-header-2row` | bloque título + filtros dentro de `table-card` | título y filtros sueltos, no en card | ❌ Falta estructura | 🔴 |
| KPI strip | Strip visible: total, aprobadas, enviadas, rechazadas (div separado) | Stats embebidos inline en subtítulo `text-sm text-gray-400` | ❌ KPI no tiene formato strip | 🟡 |
| `.table-title` | `<span class="table-title">Lista</span>` dentro del header-2row | h1 fuera del table-card | ❌ | 🔴 |
| Botón Nueva | `<button class="btn-primary">+ Nueva Cotización</button>` | `<button className="btn-primary">+ Nueva</button>` (texto corto) | ⚠️ texto diferente | 🟡 |
| Filtros | `.filter-input`, `.filter-select` | `filter-input`, `filter-select` ✅ | ✅ | 🟢 |

---

## 2. Tabla de lista

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `<div class="table-card">` | `<div className="table-card overflow-x-auto">` | ✅ | 🟢 |
| Columnas | Número, Empresa, Comercial, Estado, Líneas, Tarifa, Fecha, Acciones | Número, Empresa, Comercial, Estado, Líneas, Tarifa, Fecha, Acciones | ✅ | 🟢 |
| Badge estado | `.stag` con colores HTML | `COTIZACION_BADGE[cot.estado]` de domainConfig | ✅ | 🟢 |
| Col Tarifa | dinero gold Barlow Condensed | `text-gold font-display` | ✅ | 🟢 |
| Fila hover | `tr:hover background` | `hover:bg-surface/60` | ✅ | 🟢 |

### Acciones por fila

| Acción | HTML v6 | React | Delta | Sev |
|--------|---------|-------|-------|-----|
| Ver/Editar | ícono lápiz (borrador=editar, otros=ver) | misma lógica | ✅ | 🟢 |
| PDF | `⬇ PDF` icono | Lucide `FileDown` → `btn-secondary btn-sm` | ⚠️ icono diferente | 🟢 |
| Avanzar estado | flecha → label del next estado | `ESTADO_NEXT_LABEL[estado]` | ✅ lógica | 🟢 |
| Rechazar | botón rojo | botón rojo `btn-sm` | ✅ | 🟢 |
| Actualizar Tarifas | modal "Actualizar Tarifas %" | modal completo con preview ✅ | ✅ | 🟢 |
| Copiar link | `🔗` icono | Lucide `Link` | ✅ | 🟢 |
| Duplicar | `⧉` icono | Lucide `Copy` | ✅ | 🟢 |
| Eliminar | ícono papelera (solo borrador) | Lucide `Trash2` solo si borrador | ✅ | 🟢 |

---

## 3. Modal "Actualizar Tarifas"

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Trigger | botón en acciones por fila | misma posición | ✅ | 🟢 |
| Campo % incremento | `<input type="number">` | `<input type="number">` | ✅ | 🟢 |
| Preview tabla items | tabla items con valor original → valor nuevo | preview completo antes de confirmar | ✅ React mejora vs HTML | 🟢 |
| Acción | crea nueva cotización copia en estado `borrador` | `updateTarifasMut` → POST crea copia | ✅ | 🟢 |
| Items afectados | solo items tipo `moneda` | solo monetarios (filtro `tipo === 'moneda'`) | ✅ | 🟢 |

---

## 4. Wizard (Nueva / Editar cotización)

### Paso 1 — Datos básicos

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Empresa + NIT | autocomplete desde registros | combobox búsqueda `recordId` | ✅ | 🟢 |
| Campos | empresa, NIT, ciudad, contacto, email, comercial, paqueteadora | mismos | ✅ | 🟢 |
| Pre-relleno recordId | `?recordId=` desde Detalle tab | `searchParams.get('recordId')` | ✅ | 🟢 |
| Validación | campos obligatorios antes de avanzar | `canGoNext` guarda validación | ✅ | 🟢 |

### Paso 2 — Selección de líneas

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Fuente | Biblioteca de Tarifas (fetch) | `useLibreria()` hook | ✅ | 🟢 |
| UI | checkboxes por línea | misma estructura | ✅ | 🟢 |
| Tipo tarifa | detectado por línea (moneda/porcentaje) | por línea de `bibliotecaLineas` | ✅ | 🟢 |

### Paso 3 — Selección de ítems

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Árbol | por línea → grupo → item con checkbox + valor | misma estructura | ✅ | 🟢 |
| Snapshot | guarda snapshot al seleccionar | `itemsSnapshot` state → JSON en cotización | ✅ | 🟢 |
| Columnas dinámicas | según `columnasExtra` de biblioteca | incluidas en snapshot | ✅ | 🟢 |

### Paso 4 — Observaciones

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Predefinidas | lista de `observaciones_predefinidas` por línea | cargadas desde biblioteca por línea | ✅ | 🟢 |
| Libre | textarea observación libre por línea | textarea por línea | ✅ | 🟢 |

### Paso 5 — Resumen

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Preview | tabla agrupada por línea con totales | resumen con total calculado | ✅ | 🟢 |
| Guardar | POST `cotizacion` en estado `borrador` | `saveMut` POST, navega a `/cotizaciones` | ✅ | 🟢 |
| Edición | edita cotización existente in-place | `useParams id` + PUT | ✅ | 🟢 |

---

## 5. Vista pública (`/cot/:numero`)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Auth | ninguna | ruta pública (no requiere JWT) | ✅ | 🟢 |
| Rendering | HTML server-rendered en la propiedad `htmlPreview` | `dangerouslySetInnerHTML={{ __html: data.htmlPreview }}` | ✅ rendering delegado al backend | 🟢 |
| Background | `#0a0e1a` / card `#111827` | hardcoded en componente L18-20 | ⚠️ hardcode | 🟡 |
| Botón imprimir | `onclick="window.print()"` | `<button onClick={() => window.print()}>` | ✅ | 🟢 |
| No encontrado | 404/mensaje | `isError` → `<p>Cotización no encontrada</p>` | ✅ | 🟢 |

> **Nota importante:** `htmlPreview` es generado por el servidor. La calidad visual de la vista pública depende de la plantilla HTML en backend, no de este componente React.

---

## 6. Conexiones entre módulos

| Conexión | Dirección | Implementación | Estado |
|----------|-----------|----------------|--------|
| Detalle tab Cotizaciones → Wizard | `?recordId=id` en URL | `searchParams.get('recordId')` en Paso1 | ✅ |
| Biblioteca → Wizard Paso2/3 | `useLibreria()` | fetch biblioteca al abrir paso2 | ✅ |
| Cotización borrador → Detalle | ninguna automática — manual via link | usuario navega manualmente | ✅ |
| Aprobar cotización → estadoProspecto | ❓ no documentado — no confirmado en código | NO automático en React | ⚠️ gap funcional |
| Cotización `aceptacion_propuesta` → avanzar pipeline | HTML: avanzar cot aprobada ofrecía avanzar stage | React: sin side-effect en `avanzarEstado` | 🟡 posible gap |

---

## 7. Anti-hardcode

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `ESTADO_NEXT` (L57-63) | `Cotizaciones.tsx` | `domainConfig.ts` (clave del estado siguiente en flujo) | Mover |
| `ESTADO_NEXT_LABEL` (L64-69) | `Cotizaciones.tsx` | `domainConfig.ts` | Mover |
| Background `#0a0e1a` (L18) | `CotPublica.tsx` | CSS variable `--bg` | Reemplazar |
| Card bg `#111827` (L19) | `CotPublica.tsx` | CSS variable `--surface` | Reemplazar |

---

## 8. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| CO-01 | `section-title` ausente en lista | Agregar `<h2 className="section-title">Cotizaciones</h2>` |
| CO-02 | `.table-header-2row` ausente | Envolver título + botón Nueva + filtros en card con `.table-header-2row` |
| CO-03 | `.table-title` ausente dentro del card | Agregar `<span className="table-title">Lista de Cotizaciones</span>` |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| CO-04 | KPI strip es texto inline, no strip visual | Extraer a `<div className="kpi-strip">` con 4 cards (total/aprobadas/enviadas/rechazadas) |
| CO-05 | `aprobar cotización` no avanza `estadoProspecto` — verificar si HTML lo hacía | Investigar en HTML v6 `resolveVigencia.js` / `page-cotizaciones` |
| CO-06 | Texto botón "Nueva" vs "+ Nueva Cotización" | Ajustar label |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| CO-07 | `ESTADO_NEXT` / `ESTADO_NEXT_LABEL` hardcoded en Cotizaciones.tsx | Mover a domainConfig.ts |
| CO-08 | Colores bg en CotPublica.tsx hardcoded | Usar CSS vars `--bg` / `--surface` |

---

## 9. Checklist Codex X10 (Cotizaciones)

- [ ] Añadir `<h2 className="section-title">Cotizaciones</h2>` antes del table-card
- [ ] Crear estructura `.table-header-2row` dentro de `table-card`: `table-title` + botón Nueva + filtros
- [ ] Extraer KPI stats a strip visual con 4 cards (total / aprobadas / enviadas / rechazadas)
- [ ] Mover `ESTADO_NEXT` y `ESTADO_NEXT_LABEL` a `domainConfig.ts`
- [ ] Reemplazar `#0a0e1a` / `#111827` en CotPublica.tsx por vars CSS
- [ ] Investigar si aprobar cotización debe avanzar `estadoProspecto` automáticamente (CO-05)

---

## Estado post-C17

**Auditoría 2026-07-01 — Claude C17**

### Brechas actualizadas

| ID | Brecha | Estado post-C17 | Agente |
|----|--------|-----------------|--------|
| CO-01 | `section-title` ausente | **✅ C13** | — |
| CO-02 | `.table-header-2row` ausente | **✅ C13** | — |
| CO-03 | `.table-title` ausente | **✅ C13** | — |
| CO-04 | KPI strip es texto inline | **✅ C13** (4 celdas `crm-kpi-cell`) | — |
| CO-05 | Aprobar cotización NO avanza `estadoProspecto` | 🔴 **Abierto** → backend gap C4 de M8 | Cursor B4 |
| CO-06 | Texto botón "Nueva" corto | **✅ C13** ("+  Nueva Cotización") | — |
| CO-07 | `ESTADO_NEXT` hardcoded | **✅ C13** (movido a domainConfig) | — |
| CO-08 | Colores hardcoded CotPublica | **✅ C13** (vars CSS) | — |
| **CO-09** | **Wizard paso 3: Transporte usa campos especiales** | 🟡 Abierto — React puede tratar Transporte como checkboxes simples; HTML renderiza tabla con TRANSP_SCHEMA por grupo | Codex X10 |
| **CO-10** | **Wizard paso 3: Paqueteo filtra por paqueteadora seleccionada** | 🟡 Abierto — HTML filtra grupos por `cotWizard.paqueteadora`; verificar si React lo hace | Codex X10 |
| **CO-11** | **Wizard: cotización sin `recordId` queda huérfana** | 🟡 Abierto — `recordId` es opcional en backend; wizard debería forzar o advertir | Codex X10 / Cursor |

### Aclaración CO-05 (semántica business)

El HTML v6 en `PUT cotizacion { estado: 'aprobada' }` NO llamaba un endpoint separado — el update de estado del Record era inline en el mismo handler de guardar. En React, `updateCotizacion` solo actualiza `Cotizacion`, no tiene side-effect sobre `Record.estadoProspecto`. Fix propuesto en `SPEC-INTEGRACION-M8.md § B4`.

### Aclaración Wizard paso 3 (CO-09, CO-10)

Según `renderCotItemsStep()`:
- Si `svc === 'Transporte'`: renderiza tabla con `TRANSP_SCHEMA[g.tipo].cols` (no checkboxes por ítem sino filas editables de tarifa)
- Si `svc === 'Paqueteo'`: renderiza grupos filtrados por `cotWizard.paqueteadora`, con columnas del `PAQUETEO_SCHEMA[g.tipo].cols`
- El `itemsSnapshot` guarda el estado completo (`campos`, `tiposCampo`) — no solo qué ítems están seleccionados
- Verificar que el React Wizard step 3 maneje estos dos casos correctamente antes de X10

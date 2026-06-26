# GAP: Detalle unificado (Prospecto / Cliente) — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C8)  
**Referencia HTML:** `page-detalle` + `page-crm-detalle`  
**React:** `pages/Detalle.tsx` + `components/detalle/DetalleCrmPanel.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## Estado Cursor 2026-06 (ya implementado)

Cursor implementó la página de Detalle con clases CSS propias (`detalle-*`). Lo que ya funciona:

✅ CSS classes personalizadas: `detalle-crm`, `detalle-header`, `detalle-pipeline`, `detalle-panel`, `detalle-info-grid`, `detalle-observaciones`, `detalle-act-*`, `detalle-stage-*`  
✅ Tabs Información / Cotizaciones  
✅ `convertToCliente` con modal de confirmación y side-effects documentados  
✅ `stageHistory` / "Tiempos en etapas" — renderizado completo con `PROSPECTO_STAGE_COLOR` de domainConfig  
✅ Actividades CRUD: crear, marcar hecho, eliminar  
✅ Vista diferenciada prospecto vs cliente (pipeline solo en prospecto; ingresos vs facturación)  
✅ Contactos adicionales (contactos.slice(1))  
✅ Tab cotizaciones con tabla y link a nueva cotización

---

## 1. Layout y estructura

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `page-detalle` — sin padding general, header sticky propio | `className="detalle-crm"` (sin padding p-6) | ✅ custom class, no Tailwind padding | 🟢 |
| Header empresa | nombre + badge estado + botones en la misma barra | `detalle-header` + `detalle-header-left` + `detalle-header-actions` | ✅ | 🟢 |
| Botón Volver | `← Volver` navega a la página anterior | `detalle-back` onClick `navigate(-1)` | ✅ | 🟢 |
| Badge estado | badge de color según tipo (prospecto/cliente) | `estadoBadge` calculado desde `PROSPECTO_BADGE` / `CLIENTE_BADGE` | ✅ | 🟢 |
| Botón Convertir | `🏢 Convertir a Cliente` visible solo si isProspecto | `btn-green` visible si `isProspecto && onConvertToCliente` | ✅ | 🟢 |
| Botones Editar/Eliminar | `btn-secondary btn-sm` / `btn-danger btn-sm` | mismos | ✅ | 🟢 |
| Modal confirmación conversión | JS popup HTML | modal fijo con efecto side: copia visita/facturación/valor, crea matrizRiesgo, registra actividad | ✅ texto descriptivo correcto | 🟢 |

---

## 2. Pipeline horizontal prospecto

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Pipeline stages | `display:flex gap:0 overflow:hidden border:1px solid border-radius:8px` — botones contiguos con fondo activo azul | `detalle-pipeline` + `detalle-pipeline-stage` + `detalle-pipeline-stage--active` | ✅ misma estructura lógica — CSS en index.css | 🟢 |
| Etapas | 6: prospecto, reconocimiento, propuesta, aceptacion_propuesta, creacion_sop, facturado | `DETALLE_PIPELINE_STAGES` L18-25 — mismas 6 etapas | ⚠️ hardcoded en componente | 🟡 |
| Color activo | azul (`--accent`) | `detalle-pipeline-stage--active` en CSS | ✅ | 🟢 |
| Visibilidad | solo si es prospecto | `{isProspecto && (...)` | ✅ | 🟢 |

---

## 3. Grid de información (2 columnas)

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Layout | `grid 1fr 1fr gap:32px` | `detalle-info-grid` con `space-y-4` en cada col | ✅ | 🟢 |
| Campos col izquierda | Contacto, Email, Tel, Ciudad, Servicios | mismos | ✅ | 🟢 |
| Campos col derecha | Comercial (avatar initials), Compañías, Fecha ingreso, Ingresos/Facturación, Estado, NIT | mismos | ✅ | 🟢 |
| Labels | Barlow Condensed 11px uppercase | `detalle-field-label` en CSS | ✅ | 🟢 |
| Valores | `detalle-field-value` | mismos | ✅ | 🟢 |
| Dinero | `detalle-field-value--money` — gold/Barlow Condensed | `detalle-field-value--money` | ✅ | 🟢 |
| Link email | `<a href="mailto:...">` con clase `detalle-field-value--link` | misma implementación | ✅ | 🟢 |
| Avatar comercial | No en HTML — initials del nombre | `comercialInitials()` + `detalle-comercial-avatar` | React mejora vs HTML | 🟢 |
| Edit Ciudad | `filter-input` inline | ✅ | 🟢 | 🟢 |
| Edit Servicios | `service-chip` grid | ✅ usa `HTML_SERVICES` de constants | 🟢 | 🟢 |

### Campos editables — brecha funcional importante

| Campo | En edit state (Detalle.tsx) | Expuesto en DetalleEditState (panel) | Tiene UI de edición |
|-------|----------------------------|--------------------------------------|---------------------|
| empresa | ✅ | ❌ no en interfaz | ❌ |
| nit | ✅ | ❌ | ❌ |
| estadoProspecto | ✅ | ❌ | ❌ |
| estadoCliente | ✅ | ❌ | ❌ |
| visita / visitaCliente | ✅ | ❌ | ❌ |
| facturado | ✅ | ❌ | ❌ |
| proximoSeguimiento | ✅ | ❌ | ❌ |
| ciudad | ✅ | ✅ | ✅ |
| observaciones | ✅ | ✅ | ✅ |
| ingresosEsperados | ✅ | ✅ | ✅ |
| valor | ✅ | ✅ | ✅ |
| servicios | ✅ | ✅ | ✅ |

**Brecha D-01 🔴:** `estadoProspecto`, `estadoCliente`, `visita`, `facturado`, `proximoSeguimiento`, `empresa`, `nit` están en el estado de edición pero SIN UI para cambiarlos. En HTML el form de edición incluía estos campos.

---

## 4. Observaciones + Tiempos en etapas

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Sección observaciones | título + textarea editable | `detalle-observaciones` + `detalle-section-title "📝 Observaciones"` | ✅ | 🟢 |
| Tiempos en etapas | JS calcula desde `stageHistory` | `detalle-stage-history` + `detalle-stage-chip` con color y días | ✅ implementado | 🟢 |
| Etapa actual marcada | `(actual)` en el label | `isActual ? ' (actual)' : ''` | ✅ | 🟢 |
| Colores por etapa | `PROSPECTO_STAGE_COLOR` | importado de domainConfig | ✅ | 🟢 |

---

## 5. Actividades

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Header sección | "📅 Actividades" + `btn-green "+ Nueva actividad"` | `detalle-actividades-header` mismo | ✅ | 🟢 |
| Form nueva actividad | campos: tipo, descripción, fecha, hora (si visita), lugar (si visita) | `detalle-act-form` con `TIPO_ACT_ICON` | ✅ | 🟢 |
| Lista actividades | ordenadas desc por fecha, con icono tipo | `actividadesOrdenadas` sort desc | ✅ | 🟢 |
| Item hecho | fondo diferente / ~~tachado~~ | `detalle-act-item--done` en CSS | ✅ | 🟢 |
| Completar / Eliminar | botones por actividad | `toggleHechoMut` + `deleteActMut` | ✅ | 🟢 |
| Tipos actividad | llamada, reunion, email, visita, tarea, seguimiento | mismos 6 | ✅ | 🟢 |

---

## 6. Tab Cotizaciones

| Elemento | HTML v6 | React | Delta | Sev |
|----------|---------|-------|-------|-----|
| Trigger carga | al abrir tab "Cotizaciones" | `enabled: tab === 'cotizaciones'` (lazy) | ✅ | 🟢 |
| Tabla columnas | Número, Estado, Líneas, Comercial, Fecha, Ver | mismas | ✅ | 🟢 |
| Link nueva | `?recordId=` en URL | `to={\`/cotizaciones/nueva?recordId=${id}\`}` | ✅ | 🟢 |
| Badge estado cot | colores HTML | `COT_BADGE[cot.estado]` de domainConfig | ✅ | 🟢 |

---

## 7. Anti-hardcode

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `DETALLE_PIPELINE_STAGES` (6 etapas) | `DetalleCrmPanel.tsx` L18-25 | `constants.ts` (las usa también `CRMKanban.tsx` como `STAGES`) | Unificar con `PIPELINE_STAGES` de constants — mismas etapas |
| `ESTADOS_CLIENTE_DETALLE` | `Detalle.tsx` L23-27 | Ya existe `CLIENTE_ESTADO_OPTIONS` en domainConfig | Reemplazar por import de domainConfig |
| `ESTADOS_COT` | `Detalle.tsx` L31-37 | Ya existe `COTIZACION_ESTADO_OPTIONS` en domainConfig | Reemplazar — ya se importa `COTIZACION_BADGE` |
| `fmt()` | `DetalleCrmPanel.tsx` L27-31 | `utils/fmt.ts` | 4ª copia — extraer ya |
| `TIPO_ACT_ICON` | `DetalleCrmPanel.tsx` L9-16 | `constants.ts` | Mover |

---

## 8. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| D-01 | `estadoProspecto`, `estadoCliente`, `visita`, `facturado`, `proximoSeguimiento`, `empresa`, `nit` tienen estado de edición pero sin UI en el panel | Ampliar `DetalleEditState` y añadir selects en `DetalleCrmPanel` para esos campos |
| D-02 | `ESTADOS_COT` y `ESTADOS_CLIENTE_DETALLE` duplican constantes de domainConfig | Reemplazar por imports de domainConfig |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| D-03 | `DETALLE_PIPELINE_STAGES` hardcoded — duplica `STAGES` de CRMKanban | Centralizar en `constants.ts` como `PIPELINE_STAGES` |
| D-04 | `TIPO_ACT_ICON` hardcoded en panel | Mover a `constants.ts` |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| D-05 | `fmt()` — 4ª copia (Prospectos + CRMKanban + Clientes + DetalleCrmPanel) | Extraer a `utils/fmt.ts` urgente |
| D-06 | `ESTADOS_COT` duplica `COTIZACION_ESTADO_OPTIONS` | Reemplazar import |
| D-07 | `ESTADOS_CLIENTE_DETALLE` duplica `CLIENTE_ESTADO_OPTIONS` | Reemplazar import |

---

## 9. Checklist Codex X9 (Detalle)

- [ ] Añadir inputs de edición para `estadoProspecto/estadoCliente`, `visita/visitaCliente`, `facturado`, `proximoSeguimiento`, `empresa`, `nit` en `DetalleCrmPanel`
- [ ] Ampliar `DetalleEditState` para incluir esos campos
- [ ] Reemplazar `ESTADOS_COT` por `COTIZACION_ESTADO_OPTIONS` de domainConfig
- [ ] Reemplazar `ESTADOS_CLIENTE_DETALLE` por `CLIENTE_ESTADO_OPTIONS` de domainConfig
- [ ] Crear `utils/fmt.ts` y eliminar las 4 copias de `fmt()`
- [ ] Mover `DETALLE_PIPELINE_STAGES` a `constants.ts` (unificar con `STAGES` de CRMKanban)
- [ ] Mover `TIPO_ACT_ICON` a `constants.ts`

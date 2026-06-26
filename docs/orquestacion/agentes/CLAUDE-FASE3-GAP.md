# Claude — Fase 3 GAP (C8–C12)

**Agente:** Claude Code  
**Fase:** 3 — Análisis GAP (solo documentos)  
**Estado:** **AUTORIZADO preparación** (mientras humano revisa Fase 2)  
**Restricción:** ⛔ **No modificar `frontend/` ni `backend/`** — solo escribir GAPs en `docs/orquestacion/referencia/`

---

## Comando para el humano (pegar en Claude)

```
Ejecuta Fase 3 — GAP C8–C12 (solo docs).

Lee docs/orquestacion/agentes/CLAUDE-FASE3-GAP.md completo.
Entrega un GAP por módulo en docs/orquestacion/referencia/.

⛔ PROHIBIDO: tocar frontend/, backend/, docker, commits.
Orden: C8 → C9 → C10 → C11 → C12.
```

---

## Contexto

Fase 2 cerró el núcleo comercial (Prospectos, CRM, Clientes) con GAP C5–C7. Cursor completó además **Detalle** y **convertir prospecto→cliente** sin GAP formal.

Fase 3 documenta el **siguiente anillo** del CRM: detalle hub, cotizaciones, biblioteca, compliance BASC y herramientas comerciales.

**Referencias obligatorias por GAP:**

- HTML: `Ultima_versión/seguimiento-zymo-v6 (88).html` + `docs/_html-extract/`
- Análisis: `docs/_html-analysis.json`, `docs/_html-functions.txt`
- Grafo: `grafo-obsidian/` (nodo del módulo + `Estados_del_Proceso.md`, `Motores_de_Datos.md`)
- React actual: `frontend/src/pages/*.tsx` y componentes relacionados
- Regla: `.cursor/rules/06-no-hardcode.mdc` → recomendar `domainConfig.ts` / `constants.ts`
- Plantilla: copiar estructura de `referencia/GAP-PROSPECTOS.md`

**Formato estándar de cada GAP:**

1. Metadatos (fecha, página HTML, archivo React, severidad)
2. Estructura de página (section-title, table-card, layout)
3. Tablas / filtros / badges
4. Funcionalidad JS HTML vs API React (gaps funcionales)
5. Anti-hardcode (qué mover a `htmlV6/`)
6. Resumen brechas 🔴🟡🟢 con IDs (ej. D-01, CO-01)
7. Checklist Codex (acciones concretas para implementación)

---

## C8 — Detalle unificado (Prospecto / Cliente)

| Campo | Valor |
|-------|-------|
| **Entregable** | `referencia/GAP-DETALLE.md` |
| **HTML** | `page-detalle`, `page-crm-detalle` |
| **React** | `pages/Detalle.tsx`, `components/detalle/DetalleCrmPanel.tsx` |
| **Prioridad** | 🔴 Alta — hub central de Fase 2→3 |

### Qué comparar

- Header: nombre empresa, badge estado, botones Editar / Eliminar / **Convertir a Cliente**
- Grid 2 columnas info (contacto, email, tel, ciudad, servicios | comercial, compañías, fechas, ingresos)
- Pipeline horizontal prospecto (etapas + color activo azul)
- Panel observaciones + actividades inline (no tab separado)
- Formulario inline “+ Nueva actividad” (btn-green)
- Tabs: Información vs Cotizaciones
- Tab cotizaciones: tabla + link nueva cotización
- Comportamiento post-conversión: vista cliente (sin pipeline prospecto, campos facturación)

### Funcional (no solo visual)

- `convertirACliente` / `POST convert-to-cliente` — paridad side-effects
- `stageHistory` y “Tiempos en etapas” (HTML lo tiene; React puede estar incompleto → documentar)
- Navegación desde CRM, Prospectos, Clientes (`/detalle/:id` vs rutas con prefijo)
- Actividades CRUD + marcar hecho
- Edición inline de campos clave

### Entregable extra

- Sección **“Estado Cursor 2026-06”**: qué ya está hecho vs qué falta (evitar duplicar trabajo Codex)

---

## C9 — Cotizaciones (+ wizard + pública)

| Campo | Valor |
|-------|-------|
| **Entregable** | `referencia/GAP-COTIZACIONES.md` |
| **HTML** | `page-cotizaciones`, `page-nueva-cot`, `page-cot-publica`, `page-actualizar-tarifas` |
| **React** | `pages/Cotizaciones.tsx`, wizard (`components/cotizaciones/` o `WizardLayout`), `pages/CotPublica.tsx` |
| **Prioridad** | 🔴 Alta |

### Qué comparar

**Lista (`/cotizaciones`):**

- section-title, filtros (estado, comercial, búsqueda)
- table-card columnas: número, cliente, estado, líneas, comercial, fecha, acciones
- Acciones: ver, editar, duplicar, PDF, eliminar, avanzar estado
- Modal “Actualizar tarifas %” si existe en HTML

**Wizard (`/cotizaciones/nueva`, `/editar`):**

- 5 pasos HTML vs pasos React
- Selección cliente/record, líneas servicio, ítems biblioteca, snapshot, revisión
- Validaciones y estados pipeline cotización (`borrador → enviada → …`)

**Vista pública (`/cot/:numero`):**

- Sin auth, layout branding, totales, líneas

**Conexiones a documentar:**

- Cotización → Record (recordId)
- Aprobar cotización → ¿avanza estadoProspecto?
- Biblioteca → snapshot en cotización
- Detalle tab cotizaciones → wizard con query `?recordId=`

---

## C10 — Biblioteca de Tarifas

| Campo | Valor |
|-------|-------|
| **Entregable** | `referencia/GAP-BIBLIOTECA.md` |
| **HTML** | `page-biblioteca` |
| **React** | `pages/Biblioteca.tsx` |
| **Prioridad** | 🟡 Media-alta (alimenta cotizaciones y preliquidador) |

### Qué comparar

- Árbol líneas → grupos → ítems (expand/collapse)
- Columnas dinámicas por línea
- CRUD inline vs modales HTML
- Observaciones predefinidas por línea
- Tipos tarifa (moneda, texto, etc.)
- Estilos: ¿usa `table-card` / section-title o Tailwind suelto?

### Funcional

- Endpoints CRUD vs UI (huecos)
- Impacto en cotizaciones (snapshot structure)

---

## C11 — Matriz de Riesgos + Gestión Documental (BASC)

| Campo | Valor |
|-------|-------|
| **Entregables** | `referencia/GAP-MATRIZ-RIESGOS.md` + `referencia/GAP-GESTION-DOCUMENTAL.md` |
| **HTML** | `page-matriz-riesgos`, `page-gestion-documental` |
| **React** | `pages/MatrizRiesgos.tsx`, `pages/GestionDocumental.tsx` |
| **Prioridad** | 🟡 Media (compliance; hardcode conocido — L7 diferido) |

### Matriz — qué comparar

- Listado con filtros (search, riesgo, completa)
- Detalle scoring 6 variables + pesos + nivel (PENDIENTE→CRÍTICO)
- getOrCreate al convertir prospecto→cliente
- Mapas color hex hardcodeados → recomendar `domainConfig`

### Gestión Documental — qué comparar

- 18 documentos, pond_di / pond_ref
- Ciclo, vencimiento FR-001-GC + 1 año
- % cumplimiento, filtros listado
- Conexión recordId / cliente

**Nota L7:** Documentar hardcode actual; no proponer refactor masivo — checklist puntual para Codex X12.

---

## C12 — Herramientas comerciales (batch)

| Campo | Valor |
|-------|-------|
| **Entregable** | `referencia/GAP-HERRAMIENTAS.md` (un doc con 3 secciones) |
| **HTML** | `page-preliquidador`, `page-cotizador`, `page-ficha-cliente`, `page-ficha-detalle` |
| **React** | `Preliquidador.tsx`, `CotizadorPaqueteo.tsx`, `FichaCliente.tsx`, `FichaDetalle.tsx` |
| **Prioridad** | 🟢 Media (después de C8–C11) |

### Secciones del documento

1. **Preliquidador** — client-side MAX(calculado, mínima); historial API; link biblioteca/cotizaciones
2. **Cotizador Paqueteo** — 3 mensajerías, zonas, peso cobrable (mayormente FE)
3. **Fichas SOP** — 5 tabs, analistas, % completitud, get-or-create por recordId

### Funcional crítico

- Ficha ↔ etapa `creacion_sop` en pipeline prospecto
- Preliq historial ↔ usuario autenticado

---

## Orden y dependencias

```
C8 Detalle ──────────────────────────┐
C9 Cotizaciones ──── depende contexto C8 (tab cotizaciones)
C10 Biblioteca ───── alimenta C9/X10
C11 Matriz + Gestión Doc ── depende flujo cliente (C8 convert)
C12 Herramientas ── puede ir en paralelo tras C10
```

**Codex no implementa X9+ hasta existir el GAP correspondiente.**

---

## Criterios de Done (Claude Fase 3)

- [ ] `GAP-DETALLE.md` (C8)
- [ ] `GAP-COTIZACIONES.md` (C9)
- [ ] `GAP-BIBLIOTECA.md` (C10)
- [ ] `GAP-MATRIZ-RIESGOS.md` + `GAP-GESTION-DOCUMENTAL.md` (C11)
- [ ] `GAP-HERRAMIENTAS.md` (C12)
- [ ] Cada GAP incluye checklist Codex y tabla anti-hardcode
- [ ] Cero cambios fuera de `docs/orquestacion/referencia/`
- [ ] Opcional: screenshots QA en `referencia/qa-*` (solo si Docker :82 disponible)

---

## Qué NO es Fase 3 Claude

- ❌ Implementar CSS en React
- ❌ GAP Equipo / Calendario / SAC (Minimax M5–M7 + M8 conexiones primero)
- ❌ Re-hacer C5–C7 (ya cerrados)
- ❌ Commits (solo humano/Cursor L4)

---

*Autor: Cursor (líder) · 2026-06-22*

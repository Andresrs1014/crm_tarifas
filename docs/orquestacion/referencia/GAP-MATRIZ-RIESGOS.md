# GAP: Matriz de Riesgos (BASC) — HTML v6 vs React

**Generado:** 2026-06-25 · Claude Code (C11a)  
**Referencia HTML:** `page-matriz-riesgos`  
**React:** `pages/MatrizRiesgos.tsx`

Severidad: 🔴 ALTA · 🟡 MEDIA · 🟢 BAJA

---

## Estado Cursor 2026-06 (ya implementado)

✅ Tabs Matriz / Datos de Referencia  
✅ Tabla con edición inline por fila (InlineSelect por campo)  
✅ Guardado por fila con botón CheckCircle2  
✅ Filtros funcionales: búsqueda, riesgo, compañía, completa/pendiente  
✅ KPI strip con 5 columnas (total, pendiente, bajo, medio, alto, crítico)  
✅ Tab "Datos de Referencia": tabla de pesos y tabla de niveles de riesgo  
✅ Cálculo automático de nivel (scoring 6 variables × pesos)  
✅ `getOrCreate` al convertir prospecto→cliente (vía `convertToCliente` en Detalle.tsx)

---

## 1. Layout y estructura

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `p-6` | `className="p-6 space-y-5"` | ✅ | 🟢 |
| `section-title` | `<h2 class="section-title">Matriz de Riesgos</h2>` | `<h1 className="text-xl font-display font-bold">Matriz de Riesgos</h1>` | ❌ Falta `section-title` · usa `font-display` | 🔴 |
| Subtítulo | `FR-002-GC · Solo clientes activos` | `<p className="text-sm text-gray-400">FR-002-GC · Solo clientes activos</p>` | ✅ | 🟢 |
| Tabs | HTML: links de navegación por hash o sección | `div` con estado `tab` local: `'matriz' | 'referencia'` | ✅ equivalente | 🟢 |
| Botón Exportar Excel | HTML tenía exportar | ❌ sin exportar Excel en MatrizRiesgos | 🟡 |

---

## 2. KPI Strip

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Estructura | `div` con celdas de color por nivel | `grid grid-cols-5 gap-3` usando `card-glass rounded-xl` | ⚠️ usa `card-glass`, no `card` con `borderTop` | 🟡 |
| Datos | Total, Pendiente, Bajo, Medio, Alto, Crítico | mismos 6 indicadores | ✅ | 🟢 |
| Color | borde superior (`border-top`) por color de nivel | bg del badge según nivel | ⚠️ patrón diferente al KPI de otros módulos | 🟡 |

---

## 3. Filtros

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Search | `.filter-input` | `className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm w-48"` | ❌ no usa `.filter-input` | 🟡 |
| Estado (completa/pendiente) | `.filter-select` | mismos estilos inline | ❌ no usa `.filter-select` | 🟡 |
| Nivel de riesgo | `.filter-select` | mismos estilos inline | ❌ no usa `.filter-select` | 🟡 |
| Compañía | `.filter-select` con 4 opciones: Logimat, IMC Cargo, IMC Depósito, Aduana | 3 opciones hardcoded: Logimat, IMC Cargo, IMC Depósito | ❌ **Aduana ausente** | 🔴 |

---

## 4. Tabla principal

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Wrapper | `<div class="table-card">` | `<div className="card-glass rounded-xl border border-border overflow-x-auto">` | ❌ no usa `table-card` | 🟡 |
| Columnas | Empresa, Tipo, Compañías, (6 variables), Nivel, Completa, Acciones | mismas 14 columnas | ✅ | 🟢 |
| Edición inline | form modal HTML | `InlineSelect` por celda + botón guardar | ✅ React mejora UX | 🟢 |
| Botón guardar fila | icono ✓ | `CheckCircle2` Lucide | ✅ | 🟢 |
| Badge nivel | colores: verde/amarillo/naranja/rojo | `RIESGO_STYLE` hardcoded | ⚠️ hardcode | 🟡 |

---

## 5. Tab Datos de Referencia

| Elemento | HTML v6 | React actual | Delta | Sev |
|----------|---------|--------------|-------|-----|
| Tabla pesos | tabla de los 6 factores con su peso % | `card-glass` con tabla pesos | ✅ | 🟢 |
| Tabla niveles | PENDIENTE / BAJO / MEDIO / ALTO / CRÍTICO con rangos score | `card-glass` con tabla niveles | ✅ | 🟢 |
| Valores | todos hardcoded en ambas implementaciones | `MR_OPCIONES` y ranges inline | ⚠️ hardcode | 🟡 |

---

## 6. Anti-hardcode

| Valor | Dónde | Debería estar | Acción |
|-------|-------|--------------|--------|
| `RIESGO_STYLE` (colores hex por nivel) | `MatrizRiesgos.tsx` L22-28 | `domainConfig.ts` | Mover — afecta badges en tabla y KPI |
| `MR_OPCIONES` (opciones de los 6 factores) | `MatrizRiesgos.tsx` L8-20 | `constants.ts` | Mover — son datos de dominio BASC |
| Compañías filter `['Logimat', 'IMC Cargo', 'IMC Depósito']` | inline en filtro | `COMPANIAS_FILTER` de constants (ya existe en otros módulos) | Unificar — **agregar Aduana** |
| Pesos de factores y rangos de niveles | inline en Datos de Referencia tab | `constants.ts` | Mover |

---

## 7. Resumen de brechas

### 🔴 ALTA

| ID | Brecha | Fix |
|----|--------|-----|
| MR-01 | `section-title` ausente | `<h2 className="section-title">Matriz de Riesgos</h2>` |
| MR-02 | Compañía filter falta "Aduana" | Agregar opción + unificar con `COMPANIAS_FILTER` de constants |

### 🟡 MEDIA

| ID | Brecha | Fix |
|----|--------|-----|
| MR-03 | Filtros no usan `.filter-input` / `.filter-select` | Reemplazar estilos inline por clases HTML v6 |
| MR-04 | Tabla usa `card-glass` en vez de `table-card` | Cambiar a `table-card overflow-x-auto` |
| MR-05 | KPI usa `card-glass` — inconsistente con patrón `card` + border-top | Uniformizar KPI strip |
| MR-06 | Sin exportar Excel | Añadir export XLSX similar a GestionDocumental |

### Anti-hardcode

| ID | Brecha | Fix |
|----|--------|-----|
| MR-07 | `RIESGO_STYLE` hardcoded colors | Mover a `domainConfig.ts` |
| MR-08 | `MR_OPCIONES` hardcoded | Mover a `constants.ts` |
| MR-09 | Pesos y rangos de niveles hardcoded en tab Datos de Referencia | Mover a `constants.ts` |

---

## 8. Checklist Codex X12a (MatrizRiesgos)

- [ ] Cambiar `h1 font-display` a `<h2 className="section-title">Matriz de Riesgos</h2>`
- [ ] Agregar "Aduana" al filtro de compañías e importar desde `COMPANIAS_FILTER`
- [ ] Cambiar filtros inline a `.filter-input` y `.filter-select`
- [ ] Cambiar wrapper tabla de `card-glass` a `table-card overflow-x-auto`
- [ ] Mover `RIESGO_STYLE` a `domainConfig.ts`
- [ ] Mover `MR_OPCIONES` a `constants.ts`
- [ ] Mover pesos/rangos de Datos de Referencia a `constants.ts`
- [ ] (Opcional) Añadir export Excel similar a GestionDocumental

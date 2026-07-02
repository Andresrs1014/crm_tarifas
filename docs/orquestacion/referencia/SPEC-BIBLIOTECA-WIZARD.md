# SPEC-BIBLIOTECA-WIZARD — Biblioteca avanzada + Wizard paso 3

**Autor:** Claude C17 · **Fecha:** 2026-07-01  
**Para:** Codex X11 (Biblioteca) + Codex X10 (Wizard paso 3)  
**Fuente de verdad:** `Ultima_versión/seguimiento-zymo-v6 (88).html` — funciones `renderBiblioteca`, `renderBibGrupo`, `renderBibGrupoTransporte`, `renderBibGrupoPaqueteo`, `renderCotItemsStep`  
**Restricciones:** No tocar Docker, `.env`, Prisma schema.

---

## 1. Arquitectura general de la Biblioteca HTML

El HTML tiene **tres renderizadores distintos** según la línea:

| Línea | Renderizador | Schema | Notas |
|-------|-------------|--------|-------|
| Zona Franca, Depósito, CEDI, Aduana | `renderBibGrupo` | Columnas genéricas col1/col2/col3 (renombrables) | Grupos siempre visibles, no colapsables |
| Transporte | `renderBibGrupoTransporte` | `TRANSP_SCHEMA` (local / otros) | 2 botones "+ Nuevo grupo Local/Otros" |
| Paqueteo | `renderBibGrupoPaqueteo` | `PAQUETEO_SCHEMA` (coord_*/tcc_*/servientrega_*) | Tabs COORDINADORA / TCC / SERVIENTREGA |

La estructura exterior es igual para todas las líneas:
- Un card (línea): header clickable que despliega/colapsa el cuerpo (`toggleBibLinea`)
- Dentro: panel "Columnas", lista de grupos, botón añadir grupo, panel "Observaciones"

---

## 2. Biblioteca estándar (Zona Franca, CEDI, Depósito, Aduana)

### 2.1 Comportamiento grupos

- Los grupos se muestran **siempre** dentro del body de la línea (no colapsables)
- Cada grupo tiene: nombre editable (input), botón "🗑 Grupo", tabla de ítems
- Tabla de ítems: columna checkbox + col1 (texto) + col2 (tarifa $) + col3 (obs) + col `mínima` + botón ✕
- Botón "+ Nuevo grupo" debajo de todos los grupos
- Botón "+ Ítem" al pie de cada grupo

### 2.2 Renombrar col1/col2/col3

Dentro del panel "Columnas de la tabla en cotización", aparecen 3 inputs de texto con los valores actuales:
- Default: "Servicio" / "Tarifa" / "Observaciones"  
- Al cambiar → `updateBibColHeader(svc, 'col1', value)` → persiste en `bib.colHeaders`

**Endpoint React esperado:** `PUT /api/biblioteca/:lineaId` con campo `colHeaders: { col1, col2, col3 }`  
**Verificar:** si el campo `colHeaders` existe en el modelo `BibliotecaLinea` de Prisma.

### 2.3 Columnas extra

Además de col1/col2/col3 fijas, se pueden añadir columnas extra → array `bib.columnas`. Cada una tiene `id` y `nombre`. React ya implementa `ColumnasSection` — verificar que los inputs de renombrar col1/col2/col3 **no** están mezclados con las columnas extra (son cosas distintas).

---

## 3. Biblioteca Transporte

### 3.1 Schema fijo — `TRANSP_SCHEMA`

```typescript
// Copiar a frontend/src/lib/htmlV6/constants.ts como TRANSP_SCHEMA
export const TRANSP_SCHEMA = {
  local: {
    label: 'TRANSPORTE LOCAL',
    cols: [
      { id: 'tipoVehiculo',  nombre: 'TIPO DE VEHÍCULO',                       tipo: 'texto'       },
      { id: 'capacidades',   nombre: 'CAPACIDADES',                             tipo: 'texto'       },
      { id: 'valorMax',      nombre: 'VALOR MÁX. AUTORIZADO PARA MOVILIZAR',    tipo: 'texto'       },
      { id: 'viaje4h',       nombre: 'VIAJE 4 HORAS',                           tipo: 'tarifa'      },
      { id: 'viaje8h',       nombre: 'VIAJE 8 HORAS',                           tipo: 'tarifa'      },
      { id: 'horaAdc',       nombre: 'HORA ADICIONAL',                          tipo: 'tarifa'      },
    ],
  },
  otros: {
    label: 'OTROS SERVICIOS DE TRANSPORTE',
    cols: [
      { id: 'servicio',       nombre: 'SERVICIO',       tipo: 'texto'        },
      { id: 'caracteristica', nombre: 'CARACTERÍSTICA', tipo: 'texto'        },
      { id: 'condicion',      nombre: 'CONDICIÓN',      tipo: 'texto'        },
      { id: 'unaHora',        nombre: '(1) UNA HORA',   tipo: 'tarifa-mixta' }, // $ o %
      { id: 'minima',         nombre: 'MÍNIMA',         tipo: 'tarifa-texto' }, // $ o texto libre
    ],
  },
} as const;
```

### 3.2 Tipos de celda

| tipo | UI | Valor guardado |
|------|----|----------------|
| `texto` | `<input type="text">` | string |
| `tarifa` | `$` + input (gold) | string numérico |
| `tarifa-mixta` | select `$`/`%` + input (gold) | string numérico; tipo en `tiposCampo[col.id]` |
| `tarifa-texto` | select `$`/texto + input | string; tipo en `tiposCampo[col.id]` |

El campo `tiposCampo` es un objeto `Record<colId, 'moneda'|'porcentaje'|'texto'>` por ítem, almacenado junto a `campos`.

### 3.3 Botones de añadir grupo

```tsx
// Solo para Transporte — en lugar de "+ Nuevo grupo" genérico:
<div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
  <button className="btn btn-secondary btn-sm" onClick={() => addGrupoTransporte('local')}>
    + Nuevo grupo Transporte Local
  </button>
  <button className="btn btn-secondary btn-sm" onClick={() => addGrupoTransporte('otros')}>
    + Nuevo grupo Otros Servicios
  </button>
</div>
```

Al crear el grupo: `{ id: uuid(), nombre: TRANSP_SCHEMA[tipo].label, tipo, items: [] }`

### 3.4 Badge de tipo de grupo

En el header de cada grupo Transporte, mostrar badge de color:
- `local` → fondo `rgba(0,194,255,0.12)` · color `var(--accent)` · texto "🚛 Local"
- `otros` → fondo `rgba(245,166,35,0.12)` · color `var(--gold)` · texto "📦 Otros"

### 3.5 Panel de columnas (Transporte)

NO hay renombrado de columnas para Transporte. En su lugar mostrar:
```
Las columnas para Transporte están definidas por esquema fijo.
```

---

## 4. Biblioteca Paqueteo

### 4.1 Paqueteadoras y grupos del schema

```typescript
export const PAQUETEADORAS = ['COORDINADORA', 'TCC', 'SERVIENTREGA'] as const;

// Grupos por paqueteadora (claves del PAQUETEO_SCHEMA):
export const PAQUETEO_GRUPOS_COORD = [
  'coord_industrial', 'coord_xl', 'coord_sobreporte', 'coord_firma', 'coord_ecommerce'
];
export const PAQUETEO_GRUPOS_TCC = [
  'tcc_paqueteria', 'tcc_boomerang', 'tcc_radicacion', 'tcc_mensajeria'
];
export const PAQUETEO_GRUPOS_SERVIENTREGA = [
  'srv_documento', 'srv_sobreporte', 'srv_premier', 'srv_industrial'
];
```

### 4.2 PAQUETEO_SCHEMA (extracto de las claves clave)

```typescript
// Extracto — copiar COMPLETO desde el HTML (líneas 4617–4900)
export const PAQUETEO_SCHEMA: Record<string, {
  paqueteadora: 'COORDINADORA' | 'TCC' | 'SERVIENTREGA';
  label: string;
  cols: Array<{ id: string; nombre: string; tipo: 'texto' | 'moneda' | 'numero' | 'porcentaje' }>;
  colspanGroups?: Array<{ label: string; cols: string[] }>;
}> = {
  coord_industrial: {
    paqueteadora: 'COORDINADORA',
    label: 'Mercancía Industrial',
    cols: [
      { id: 'trayecto', nombre: 'Trayecto',     tipo: 'texto'      },
      { id: 'minFlete', nombre: 'Mínima Flete', tipo: 'moneda'     },
      { id: 'minKilos', nombre: 'Mínima Kilos', tipo: 'numero'     },
      { id: 'pctManejo',nombre: '% Manejo',     tipo: 'porcentaje' },
      { id: 'manejo',   nombre: 'Manejo',        tipo: 'moneda'     },
    ],
  },
  // ... (completar con tcc_*, srv_* desde el HTML)
};
```

> ⚠️ **Acción X11:** copiar el PAQUETEO_SCHEMA completo (≈280 líneas en el HTML, líneas 4617–4900) a `constants.ts`. No reescribir — copiar literal y adaptar sintaxis TS.

### 4.3 UI de tabs en Biblioteca Paqueteo

Dentro del body de la línea Paqueteo, mostrar 3 tabs, uno por paqueteadora:

```
[COORDINADORA ▼]  [TCC ▼]  [SERVIENTREGA ▼]   ← tabs colapsables por paqueteadora
```

Cada tab muestra los grupos de esa paqueteadora. Al expandir:
- Lista de grupos (`renderBibGrupoPaqueteo` por grupo)
- Cada grupo: header + tabla según `PAQUETEO_SCHEMA[g.tipo].cols`

No hay botones de "+ Nuevo grupo" para Paqueteo — los grupos están fijos por schema. El usuario solo edita los valores de las filas (ítems) dentro de cada grupo.

### 4.4 Cabeceras con colspan (tcc_radicacion)

El grupo `tcc_radicacion` usa `colspanGroups` para agrupar columnas bajo un super-header. La tabla tiene dos filas de encabezado:
- Fila 1: col checkbox + primera col simple + colspan groups
- Fila 2: subcols del colspan

Implementar en `renderBibGrupoPaqueteo` cuando `schema.colspanGroups` existe.

### 4.5 Panel de columnas (Paqueteo)

Igual que Transporte — columnas fijas por schema:
```
Las columnas para Paqueteo están definidas por esquema fijo.
```

---

## 5. Wizard paso 3 — renderCotItemsStep equivalente (React)

### 5.1 Flujo general

Paso 3 del Wizard: el usuario ve grupos → ítems con checkbox para seleccionar cuáles incluir en la cotización.

```
Por cada línea seleccionada en paso 2:
  if (línea === 'Transporte'):
    renderizar grupos con TRANSP_SCHEMA.cols (tabla de tarifas, todos sel=true por defecto)
  elif (línea === 'Paqueteo'):
    filtrar grupos por paqueteadora seleccionada en paso 1
    renderizar con PAQUETEO_SCHEMA[g.tipo].cols
  else:
    renderizar grupos con col1/col2/col3 + columnas extra
    cada ítem tiene checkbox
```

### 5.2 Snapshot (itemsSnapshot)

Al avanzar a paso 4 (o al guardar), construir `itemsSnapshot`:

```typescript
// Por línea → por grupo → por ítem seleccionado:
{
  [svc: string]: {
    [grupoId: string]: {
      sel: boolean;         // grupo seleccionado
      nombre: string;       // nombre del grupo
      items: Array<{
        id: string;
        sel: boolean;       // ítem seleccionado
        nombre: string;
        valor?: number;
        tipo?: 'moneda' | 'porcentaje';
        minima?: number;
        // Para Transporte/Paqueteo:
        campos?: Record<string, string>;
        tiposCampo?: Record<string, 'moneda' | 'porcentaje' | 'texto'>;
      }>;
    };
  };
}
```

El snapshot debe ser **inmutable** (deep clone al momento de crear la cotización). No se actualiza si cambia la Biblioteca.

### 5.3 Diferencias Transporte vs resto en Wizard

| Aspecto | Estándar | Transporte | Paqueteo |
|---------|----------|------------|----------|
| Checkbox por ítem | ✅ | ✅ | ✅ |
| Edición de valor en wizard | No (se toma de biblioteca) | **Sí** — el wizard permite editar `campos` por fila | **Sí** — ídem |
| Columnas | col1/col2/col3 | TRANSP_SCHEMA.cols | PAQUETEO_SCHEMA[g.tipo].cols |
| Grupo sel por defecto | Manual | `sel: true` (todas las filas) | `sel: true` |
| Filtro por paqueteadora | No aplica | No aplica | `schema.paqueteadora === cotWizard.paqueteadora` |

> **Verificar en React:** El `WizardLayout.tsx` paso 3 debe manejar estos tres casos. Si actualmente trata Transporte/Paqueteo como líneas estándar (solo checkboxes), eso es el gap CO-09/CO-10.

### 5.4 Contratos API — campos Prisma relevantes

| Modelo | Campo | Tipo | Notas |
|--------|-------|------|-------|
| `BibliotecaLinea` | `colHeaders` | `Json?` | `{ col1: string, col2: string, col3: string }` — verificar si existe |
| `BibliotecaGrupo` | `tipo` | `String?` | `'local'` / `'otros'` para Transporte; clave de PAQUETEO_SCHEMA para Paqueteo |
| `BibliotecaItem` | `campos` | `Json?` | Para Transporte/Paqueteo: `Record<colId, string>` |
| `BibliotecaItem` | `tiposCampo` | `Json?` | Para celdas mixtas: `Record<colId, 'moneda'|'porcentaje'|'texto'>` |
| `Cotizacion` | `itemsSnapshot` | `Json` | Ver estructura §5.2 |

> Si `campos` y `tiposCampo` no existen en el schema Prisma → Codex X11 debe evaluar si añadirlos (requiere migración) o si el schema ya tiene campo `Json` genérico en BibliotecaItem.

---

## 6. Criterios de aceptación (mínimo 8, verificables en :82)

| # | Criterio | Cómo verificar |
|---|----------|---------------|
| AC-01 | Biblioteca → línea Transporte → expandir → ver 2 botones "+ Nuevo grupo Transporte Local/Otros" | Click en línea Transporte |
| AC-02 | Añadir "Nuevo grupo Transporte Local" → aparece tabla con columnas: Tipo de Vehículo, Capacidades, Valor Máx., Viaje 4h, Viaje 8h, Hora Adicional | Click + Nuevo grupo Local |
| AC-03 | Añadir "Nuevo grupo Otros Servicios" → tabla con: Servicio, Característica, Condición, (1) Una Hora (con $ o %), Mínima (con $ o texto) | Click + Nuevo grupo Otros |
| AC-04 | Biblioteca → línea Paqueteo → expandir → ver 3 tabs: COORDINADORA, TCC, SERVIENTREGA | Click en línea Paqueteo |
| AC-05 | Tab COORDINADORA → grupos: Mercancía Industrial, Mercancía XL, Sobreporte, Firma, ECOMMERCE | Expandir tab |
| AC-06 | Biblioteca estándar (Zona Franca) → "Columnas de la tabla" → editar nombre col1 → guardar → reabrir → persiste el nombre | Editar col1, recargar |
| AC-07 | Wizard paso 3 con línea Transporte seleccionada → se muestran grupos Transporte con sus columnas de tarifa (no checkboxes simples) | Nueva cotización + Transporte |
| AC-08 | Wizard paso 3 con línea Paqueteo + paqueteadora COORDINADORA → solo grupos de Coordinadora visibles | Nueva cot + Paqueteo + Coordinadora |
| AC-09 | Cotización creada con Transporte → PDF generado muestra columnas de tarifa correctas (Viaje 4h, 8h, etc.) | Ver PDF de la cotización |
| AC-10 | `npm run build` pasa sin errores TypeScript después de X11 | `npm run build` |

---

## 7. Handoff

| Tarea | Agente | Depende de |
|-------|--------|-----------|
| Implementar Biblioteca Transporte (BIB-05) | Codex X11 | Esta spec §3 |
| Implementar Biblioteca Paqueteo (BIB-06) | Codex X11 | Esta spec §4, PAQUETEO_SCHEMA completo |
| Fix Wizard paso 3 Transporte/Paqueteo (CO-09/CO-10) | Codex X10 | Esta spec §5, X11 |
| Verificar campo `colHeaders` en Prisma | Codex X11 | Ver schema.prisma |
| QA AC-01 a AC-10 en :82 | Cursor / Humano | X11 + X10 |

# QA Visual C4 — HTML v6 vs React :82

**Fecha:** 2026-06-25  
**Por:** Claude Code (tarea C4)  
**Docker:** ✅ `docker compose up --build -d` OK  
**Imágenes:** `referencia/qa-html-*.png` y `referencia/qa-react-*.png`

---

## Estado Docker

```
crm_postgres   Healthy
crm_backend    Healthy  
crm_frontend   Started → http://localhost:82
```

Login verificado: `admin_local / AdminLocal2026!` ✅

---

## Dashboard — Diferencias observadas

### 🔴 CRÍTICO — visible a primera vista

| # | Elemento | HTML v6 | React :82 | Nuevo hallazgo |
|---|----------|---------|-----------|----------------|
| D1 | **Filtros orientación** | 3 selects en **fila horizontal** (FILTROS: [select] [select] [select] [btn Excel]) | 3 selects **apilados verticalmente**, cada uno full-width | **NO estaba en GAP** — raíz: `.input` tiene `w-full` |
| D2 | **Header alto** | ~60px, fondo sólido `#0e1320` | ~70px, fondo gradiente | Confirma G-02 |
| D3 | **Sidebar ancho** | 200px, `#0e1320` | 220px, `#111827` | Confirma G-03, G-04 |
| D4 | **Nav-tab fuente** | Barlow Condensed UPPERCASE, sin iconos Lucide (emoji inline en label) | DM Sans text-sm, iconos Lucide a la izquierda | Confirma G-05 |
| D5 | **Chart titles** | Barlow Condensed 15px UPPERCASE con barra cyan `::before` | text-sm font-semibold, sin barra | Confirma G-06, G-08 |
| D6 | **Charts grid** | 2 columnas fijas (`1fr 1fr`) | responsive auto-fit (puede romper a 4 cols en wide) | Confirma G-07 |

### 🟡 MEDIA

| # | Elemento | HTML v6 | React :82 |
|---|----------|---------|-----------|
| D7 | KPI card 6 (Visitas) | wrappea a segunda fila junto a los 5 cards | igual comportamiento |
| D8 | Nombre nav "CRM" | `🗂️ CRM` | `CRM Pipeline` | distinto label |
| D9 | Barra izquierda nav activo | 3px accent con background accent/7% | mismo estilo, OK |

---

## Registro — Diferencias observadas

### 🔴 CRÍTICO

| # | Elemento | HTML v6 | React :82 | Nuevo hallazgo |
|---|----------|---------|-----------|----------------|
| R1 | **type-toggle** | Pill unificado, ancho total, PROSPECTO\|CLIENTE sin gap, borde compartido | Dos botones separados con `gap-2`, bordes individuales rounded-lg | Confirma G-12 — muy visible |
| R2 | **Labels** | TODO UPPERCASE, 11px, letter-spacing 1.5px, `var(--text2)` | minúsculas sin tracking `text-xs text-muted` | Confirma G-11 — afecta toda la forma |
| R3 | **section-title** | `NUEVO REGISTRO` — Barlow Condensed 800 24px UPPERCASE | `+ Nuevo Registro` — DM Sans bold text-2xl, no uppercase | Confirma G-10 |
| R4 | **form-grid cols** | 3 cols primera fila (Empresa, NIT, Ciudad) con `auto-fit minmax(220px)` | 2 cols fijas (`sm:grid-cols-2`) | Confirma G-20 — HTML muestra 3 en ~1050px |
| R5 | **Contenedor width** | Full-width hasta el borde del content-wrap | Centrado `max-w-4xl` con márgenes laterales | Confirma G-09 |
| R6 | **form-card vs card** | `.form-card { padding: 28px }` sin espacio extra arriba | `card p-6 space-y-6` — espacio entre secciones más amplio | Parcialmente en GAP |

### 🟡 MEDIA

| # | Elemento | HTML v6 | React :82 |
|---|----------|---------|-----------|
| R7 | Contactos section | Lista flat dentro del form-card | Cada contacto en card separada (`bg-surface2 border`) |
| R8 | Label "TIPO DE REGISTRO" | UPPERCASE tracking | sin uppercase |
| R9 | Botón "+ AGREGAR CONTACTO" | `.btn .btn-secondary .btn-sm` Barlow Condensed | `btn-secondary btn-sm text-xs` DM Sans |

---

## Nuevo hallazgo crítico (no estaba en GAP): D1

**Filtros del Dashboard apilados verticalmente** — la causa raíz es que la clase `.input` define `@apply w-full ...`, por lo que cada `<select className="input ...">` ocupa 100% del ancho del contenedor flex, forzando stack vertical.

**Fix directo:** usar `.filter-select` (que existe en `index.css` con `width: auto`) en lugar de `.input` en los 3 selects del Dashboard.

Líneas afectadas en `Dashboard.tsx`: ~141, ~150, ~160

---

## Screenshots guardados

| Archivo | Descripción |
|---------|-------------|
| `qa-react-dashboard.png` | React :82 Dashboard (sin datos) |
| `qa-react-registro.png` | React :82 Registro |
| `qa-html-dashboard.png` | HTML v6 Dashboard (con datos de ejemplo) |
| `qa-html-registro.png` | HTML v6 Registro |

---

## Prioridad de correcciones actualizadas

Añadir a GAP-DASHBOARD-REGISTRO.md:

| ID | Nueva brecha | Fix | Archivo |
|----|-------------|-----|---------|
| G-26 | Filtros Dashboard apilados: usar `.filter-select` en vez de `.input` | cambiar clase en selects | `Dashboard.tsx` L141, L150, L160 |

Confirmar con alta confianza (visual):
- G-01 fuente body ✅
- G-02 header 70→60px ✅  
- G-03 sidebar 220→200px ✅
- G-05 nav-tab Barlow Condensed ✅
- G-06 chart-title ::before ✅
- G-07 charts-grid 2-col fijo ✅
- G-09 max-w-4xl → full-width ✅
- G-10 section-title Barlow Condensed uppercase ✅
- G-11 labels uppercase tracking ✅
- G-12 type-toggle pill unificado ✅

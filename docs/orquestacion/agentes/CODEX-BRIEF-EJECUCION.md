# CODEX — Brief de ejecución (específico)

> **Activación:** `Ejecuta lo que tenga tu nombre`  
> **Solo estas tareas.** Ignora tu reporte genérico donde contradiga este archivo.  
> **Leer antes:** `reportes/ANALISIS-LIDER-CODEX.md`

## Objetivo

Fase 0 visual: shell + design system HTML v6 en React. **Sin** upgrades npm/multer. **Sin** renombrar clases inventadas.

---

## Reglas de ejecución

1. Usar **solo nombres de clase que existen en el HTML** (lista abajo).
2. Si necesitas CSS del monolito y `docs/orquestacion/referencia/html-v6-styles.css` no existe → extraer tú mismo del bloque `<style>` del HTML **solo las secciones indicadas**, no inventar.
3. Tras cada bloque (X1–X4): `cd frontend && npm run build` debe pasar.
4. Documentar en `reportes/REPORTE-CODEX-EJECUCION.md` qué archivos tocaste (sin Docker compose down -v).
5. Si ves código de otro agente mal → `reportes/OBJECIONES-CODEX.md`, **no lo arregles** fuera de tu scope.

---

## Nombres de clase REALES (HTML v6)

```
.header .sidebar .main .page .nav-tab .sidebar-label
.stats-row .stat-card .stat-label .stat-value .stat-sub
.charts-grid .chart-card .chart-title .chart-wrap
.form-card .form-grid .form-group .form-group.full
.service-chip .services-grid
.type-toggle .type-btn .active-prospecto .active-cliente
.contact-card .contact-card-header .contact-principal-badge
.table-card .table-header .table-title .filter-input .filter-select
.section-title .badge .stag
input, select, textarea  (estilos globales del HTML, no clases form-input)
```

**Prohibido introducir:** `app-container`, `top-header`, `main-content`, `form-input`, `form-label`, `billing-line`.

---

## X1 — Variables y tipografía base

**Archivos:** `frontend/src/index.css`, `frontend/tailwind.config.js`

| Cambio | De | A |
|--------|----|---|
| `html`, `body` font | `'DM Sans'` | `'Barlow', sans-serif` |
| Tokens CSS `:root` | (crear en html-v6.css o index) | Copiar del HTML: `--bg`, `--surface`, `--surface2`, `--accent`, `--accent2`, `--gold`, `--green`, `--text`, `--text2`, `--border` |
| `tailwind fontFamily.sans` | DM Sans | `['Barlow', 'DM Sans', 'sans-serif']` |
| `tailwind fontFamily.condensed` | DM Sans | `['Barlow Condensed', 'sans-serif']` |
| Mantener `font-display` para KPIs | — | Barlow Condensed 800 en `.stat-value` |

**Criterio:** inspeccionar body en DevTools → computed font = Barlow.

---

## X2 — Shell layout (medidas exactas)

**Archivos:**

| Archivo | Línea aprox | Cambio |
|---------|-------------|--------|
| `Header.tsx` | `h-[70px]` | `h-[60px]` |
| `Sidebar.tsx` | `top: '70px'`, `width: '220px'` | `top: '60px'`, `width: '200px'` |
| `Layout.tsx` | `marginTop: '70px'`, `marginLeft: '220px'`, `p-7` en main | `60px`, `200px`, quitar padding extra del wrapper (solo `.main` style) |
| `Layout.tsx` | inner div | Aplicar className `main` o style `padding: 20px 24px` como HTML |

**Archivos página:** quitar `p-6` duplicado en `Dashboard.tsx` y `Registro.tsx` si Layout ya aplica padding.

**Criterio:** sidebar 200px, header 60px medidos en DevTools.

---

## X3 — Crear `frontend/src/styles/html-v6.css`

**Importar en** `main.tsx`: `import './styles/html-v6.css'`

Portar del HTML (copiar CSS literal, ajustar rutas si hace falta):

| Bloque CSS HTML | Clases incluidas |
|-----------------|------------------|
| Stats | `.stats-row`, `.stat-card`, `.stat-label`, `.stat-value`, `.stat-sub` + variantes `.blue/.cyan/.green/...` |
| Charts | `.charts-grid`, `.chart-card`, `.chart-title` (+ `::before`), `.chart-wrap` |
| Forms | `.form-card`, `.form-grid`, `.form-group`, `label`, `input, select, textarea`, `textarea` |
| Registro | `.type-toggle`, `.type-btn`, `.service-chip`, `.services-grid`, `.contact-card` |
| Tables | `.table-card`, `.table-header`, `.table-title`, `.filter-input`, `.filter-select`, `table`, `thead th`, `tbody tr/td` |
| Section | `.section-title` |

**Estrategia:** copiar del monolito, **no reescribir con @apply Tailwind** salvo imports.

**Deprecar gradualmente:** clases `html-stat-card` etc. — reemplazar usos en Dashboard/Registro por `.stat-card` nativas del HTML en X4.

**Criterio:** archivo existe, importado, build pasa.

---

## X4 — Dashboard + Registro (solo markup/clases, misma lógica)

### Registro.tsx

| Quitar | Poner |
|--------|-------|
| `max-w-4xl mx-auto` | contenedor ancho completo dentro de `.main` |
| `card p-6 space-y-6` | `.form-card` |
| grid Tailwind genérico datos básicos | `.form-grid` + `.form-group` |
| botones tipo prospecto/cliente sueltos | `.type-toggle` + `.type-btn` + `.active-prospecto`/`.active-cliente` |
| chips servicios actuales | `.services-grid` + `.service-chip` + `.selected` |
| tarjetas contacto `rounded-xl` | `.contact-card` estructura como `renderContactosList.js` |

Referencia JS/HTML:
- `docs/_html-extract/page-registro.html`
- `docs/_html-extract/saveRecord.js`, `renderContactosList.js`, `buildServiceChips.js`

### Dashboard.tsx

| Quitar | Poner |
|--------|-------|
| `html-stat-card` | `.stat-card` + tono `.blue/.cyan/...` |
| `html-chart-card` | `.chart-card` |
| `html-charts-grid` | `.charts-grid` |
| títulos planos | `.chart-title` |
| filtros `.input` | `.filter-select` donde aplique |

Referencia:
- `docs/_html-extract/page-dashboard.html`
- `docs/_html-extract/renderDashboard.js`

**No cambiar:** hooks, `useQuery`, funciones en `lib/htmlV6/*`, Recharts (solo contenedores CSS).

**Criterio agent browser (obligatorio al cerrar X4):**

1. Login http://localhost:82
2. Dashboard: 6 KPIs visibles, filtros en una fila, sin doble padding excesivo
3. Registro: formulario ocupa ancho útil (no columna estrecha centrada)
4. Captura nota en `REPORTE-CODEX-EJECUCION.md`

---

## X5 — Verificación final

```powershell
cd frontend; npm run build
docker compose build frontend
```

Si falla CSS Tailwind `@apply` con clases custom → usar CSS puro del HTML, no @apply.

---

## Fuera de scope (NO hacer)

- ❌ `npm audit fix`, upgrade multer
- ❌ Módulos Prospectos, CRM, Cotizaciones
- ❌ Cambiar lógica backend
- ❌ Renombrar rutas React

---

## Entregable

Archivo `docs/orquestacion/reportes/REPORTE-CODEX-EJECUCION.md` con:

- Checklist X1–X5
- Screenshots o descripción browser QA
- Build OK sí/no

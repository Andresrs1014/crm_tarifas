# Análisis líder — reporte Codex vs realidad

**Fecha:** 2026-06-25 · **Cursor Composer (líder)**

## Veredicto

El reporte Codex **acertó en lo operativo** (build npm/Docker verde, medidas 70/220 vs 60/200, `max-w-4xl`, tipografía DM vs Barlow) pero **falló en precisión HTML** en varios nombres de clases inventados. Por eso no genera confianza para ejecutar sin un brief más estricto.

---

## Lo que Codex acertó ✅

| Afirmación | Verificado |
|------------|------------|
| `npm run build` frontend/backend OK | ✅ |
| Docker compose up OK, health OK | ✅ (según su reporte) |
| Header 70px, Sidebar 220px | ✅ `Header.tsx:29`, `Sidebar.tsx:59-61`, `Layout.tsx:9-13` |
| Registro `max-w-4xl mx-auto` | ✅ `Registro.tsx:243` |
| Body usa DM Sans, no Barlow | ✅ `index.css:7-12` |
| Clases `html-*` parciales en Dashboard | ✅ `index.css` |
| Falta capa CSS sistemática del monolito | ✅ no existe `frontend/src/styles/html-v6.css` |

---

## Lo que Codex inventó o exageró ❌

| En reporte Codex | Realidad HTML |
|------------------|---------------|
| `app-container`, `top-header`, `main-content` | **No existen** en el HTML |
| `form-input`, `form-select`, `form-textarea` | **No existen** — el HTML usa selectores `input, select, textarea` |
| `form-section`, `form-label` | **No existen** — usa `.form-group` + `label` |
| `billing-line`, `billing-total` | **No existen** — billing es JS dinámico + `.form-group` |
| Priorizar `npm audit` / `multer` upgrade | **Fuera de scope** Fase 0 paridad visual — no tocar hasta aval explícito |
| Smoke “responsive básico” | HTML es desktop-first operativo — prioridad paridad desktop |

**Clases reales confirmadas en el HTML:** `.header`, `.sidebar`, `.main`, `.nav-tab`, `.form-card`, `.form-grid`, `.service-chip`, `.type-toggle`, `.type-btn`, `.contact-card`, `.charts-grid`, `.chart-card`, `.stat-card`, `.stats-row`, `.table-card`.

---

## Consenso de los 3 reportes (Claude + Minimax + líder)

1. **HTML manda** — Barlow body, Barlow Condensed títulos/KPIs
2. **Shell:** 60px header, 200px sidebar, `.main { padding: 20px 24px }`
3. **CSS:** portar clases con **nombres idénticos** al HTML, no prefijo `html-*` ni inventos
4. **Registro:** ancho completo, sin `max-w-4xl`
5. **Claude** extrae CSS crudo → **Codex** lo integra en React
6. **Minimax** NO Docker; fixes mínimos de config solo si Codex no los tomó

---

## Acción

Codex no ejecuta desde su reporte genérico. Ejecuta solo:

**`docs/orquestacion/agentes/CODEX-BRIEF-EJECUCION.md`**

Criterios de aceptación incluidos ahí. Sin desviaciones.

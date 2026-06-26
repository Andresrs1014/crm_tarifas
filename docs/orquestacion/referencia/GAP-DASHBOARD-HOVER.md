# GAP Dashboard — Hover e interactividad gráficas (G-27…G-30)

**Fecha:** 2026-06-25  
**Reportado por:** Humano — tooltips blancos, gráficas “muertas” al hover  
**Referencia:** HTML v6 Chart.js vs React Recharts

---

## Diagnóstico

| ID | HTML v6 (Chart.js) | React (Recharts) antes | Severidad |
|----|-------------------|------------------------|-----------|
| G-27 | Tooltip fondo oscuro `#131a28`, texto claro | Tooltip default blanco (#fff) | 🔴 |
| G-28 | Doughnut/pie responden al hover + tooltip | Pie “Prospectos vs Clientes” sin `<Tooltip>` | 🔴 |
| G-29 | Pipeline cotizaciones pie con hover | Pie cotizaciones sin tooltip ni activeShape | 🔴 |
| G-30 | KPI `.stat-card:hover` solo `translateY(-2px)` | OK en CSS; gráficas parecían “imagen” por G-27/G-28 | 🟡 |

**Causa raíz:** Recharts trae estilos por defecto (tooltip blanco). Varios `<PieChart>` no tenían `<Tooltip>` ni segmento activo.

---

## Fix aplicado (Cursor L2 — 2026-06-25)

| Archivo | Cambio |
|---------|--------|
| `frontend/src/lib/htmlV6/chartTheme.ts` | Props compartidos tooltip/ejes/leyenda oscuros |
| `frontend/src/lib/htmlV6/PieActiveShape.tsx` | Segmento pie crece +6px al hover |
| `frontend/src/pages/Dashboard.tsx` | Todos los charts usan tema HTML |
| `frontend/src/styles/html-v6.css` | Fallback CSS `.recharts-default-tooltip`, stat-card shadow hover |

---

## Pendiente / otros agentes

| ID | Tarea | Agente |
|----|-------|--------|
| X8 | Replicar `chartTheme` en otros módulos con Recharts (Gerencial, etc.) | Codex |
| C8 | QA visual hover Dashboard vs HTML (screenshots) | Claude |

---

## Verificación humana

1. http://localhost:82/dashboard — login
2. Hover KPIs: deben **subir** ligeramente, sin fondo blanco
3. Hover tortas/barras/líneas: tooltip **oscuro** con texto legible
4. Tortas sin datos no deben mostrar tooltip vacío

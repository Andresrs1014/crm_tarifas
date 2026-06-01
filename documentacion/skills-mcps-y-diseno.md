# CRM ZYMO — Skills, MCPs y Mejoras de Diseño

> Generado: 28 mayo 2026 | Estado del build: ✅ Desbloqueado

---

## 1. SKILLS RECOMENDADAS POR DOMINIO

### 🎨 Frontend / UI (React + Tailwind)
| Skill | Installs | Uso |
|-------|----------|-----|
| `frontend-design` (ya instalada) | Global | Dirección estética, micro-animaciones, design tokens |
| `web-design-guidelines` (ya instalada) | Global | Auditoría UI antes de cada commit |
| `ansanabria/skills@recharts` | 590 | Gráficas Dashboard — recharts patterns |
| `daffy0208/ai-dev-standards@data-visualizer` | 532 | Visualización de datos avanzada |

**Instalar:**
```bash
npx skills add ansanabria/skills@recharts -g -y
npx skills add daffy0208/ai-dev-standards@data-visualizer -g -y
```

### 🔐 Seguridad / Auth / SSO
| Skill | Installs | Uso |
|-------|----------|-----|
| `wshobson/agents@auth-implementation-patterns` | 8.4K | Patrones SSO + JWT — la más instalada |
| `mindrally/skills@jwt-security` | 861 | Hardening JWT HS256 |
| `pluginagentmarketplace/custom-plugin-nodejs@jwt-authentication` | 148 | JWT en Node.js/Express |

**Instalar:**
```bash
npx skills add wshobson/agents@auth-implementation-patterns -g -y
npx skills add mindrally/skills@jwt-security -g -y
```

### 🐳 Docker / Despliegue
| Skill | Installs | Uso |
|-------|----------|-----|
| `ailabs-393/ai-labs-claude-skills@docker-containerization` | 756 | Docker multi-stage + compose |
| `pluginagentmarketplace/custom-plugin-nodejs@docker-deployment` | 426 | Deploy Node.js en Docker |
| `thebushidocollective/han@docker-compose-production` | 201 | docker-compose producción |

**Instalar:**
```bash
npx skills add ailabs-393/ai-labs-claude-skills@docker-containerization -g -y
```

### 🛠️ Backend Node.js
| Skill | Installs | Uso |
|-------|----------|-----|
| `vasilyu1983/ai-agents-public@software-backend` | 177 | Patrones backend generales |
| `oimiragieo/agent-studio@nodejs-expert` | 109 | Node.js + Express expert patterns |
| `partme-ai/full-stack-skills@express` | 23 | Express 5 patterns |

**Instalar:**
```bash
npx skills add oimiragieo/agent-studio@nodejs-expert -g -y
```

---

## 2. MCPs A CONSTRUIR (implementar de últimas)

> Cada MCP usa Python/FastMCP con transporte streamable HTTP (según reglas globales).

### MCP 1 — `crm-cotizaciones-mcp`
**Automatiza:** Ciclo completo de cotizaciones
```
Herramientas expuestas:
- get_cotizacion(numero)        → devuelve cotización completa
- crear_cotizacion(datos)       → genera COT-XXX atómico
- enviar_cotizacion(id, email)  → envía por email con PDF adjunto
- actualizar_tarifas(id, pct)   → incremento porcentual (nueva versión)
- get_estado_pipeline()         → resumen de cotizaciones por estado
```
**Caso de uso:** Integrar con un agente de WhatsApp/email que genere cotizaciones sin entrar al CRM.

---

### MCP 2 — `crm-analytics-mcp`
**Automatiza:** Dashboard KPIs en tiempo real
```
Herramientas expuestas:
- get_kpis(mes?, comercialId?)  → stats consolidadas
- get_ranking_comerciales()     → tabla clasificatoria
- get_pipeline_funnel()         → prospectos por etapa
- get_alertas()                 → sin actividad >30 días, cumpleaños próximos
```
**Caso de uso:** Envío automático de reporte semanal al equipo comercial por Slack/WhatsApp.

---

### MCP 3 — `crm-sac-mcp`
**Automatiza:** Gestión SAC y cumpleaños
```
Herramientas expuestas:
- get_cumpleanos_mes(mes)       → contactos con cumpleaños
- registrar_entrega_regalo(id, fotos[]) → sube fotos + marca como entregado
- get_pendientes_sac()          → sin regalo registrado en el mes
```
**Caso de uso:** Bot que recuerde al equipo los cumpleaños pendientes un mes antes, y un día antes del cumpleaños.
Correo para contabilidad y administrativo que validen la cartera y le entreguen a los que se deba un regalo de cumpleaños y realice la solicitud de compra, en una lista de regalos de cumpleaños, únicamente cliente aprobados (Al día con cartera).

Tarjeta de cumpleaños Cliente -> Via outlook
Sube foto con el MCP automáticamente al CRM

---

### MCP 4 — `crm-import-mcp`
**Automatiza:** Importación masiva desde Excel/CRM externo
```
Herramientas expuestas:
- validate_excel(file_path)     → valida estructura antes de importar
- import_records(file_path)     → importa con reporte de errores
- get_import_status(job_id)     → progreso en tiempo real
- rollback_import(job_id)       → revierte importación fallida
```
**Caso de uso:** Migración automática desde el CRM anterior (Python/SQLite).

---

### MCP 5 — `biblioteca-tarifas-mcp`
**Automatiza:** Gestión de la biblioteca de servicios
```
Herramientas expuestas:
- get_biblioteca_completa()     → árbol líneas → grupos → items
- actualizar_tarifa(item_id, valor) → actualiza tarifa específica
- incremento_masivo(linea_id, pct)  → sube todas las tarifas de una línea
- export_biblioteca_excel()     → exporta tarifas a Excel para revisión
```
**Caso de uso:** Actualización masiva de tarifas sin entrar al CRM, auditable via Excel.

---

## 3. MEJORAS DE DISEÑO (con skills frontend-design)

### Micro-animaciones sugeridas
| Momento | Animación | Implementación |
|---------|-----------|----------------|
| Carga de tabla | Skeleton shimmer por fila | CSS `animate-pulse` con delay escalonado |
| Cambio de estado badge | Flip/scale 200ms | `transform: scale(0.8→1)` + color transition |
| KPI card | Count-up animado | `useCountUp` hook con easing |
| Toast notification | Slide-up + fade | Ya implementado con `slideUp` |
| Hover en fila | Accent left-border | `border-l-2 border-transparent hover:border-accent` |
| Kanban drag | Card lift shadow | `shadow-card → shadow-accent` + rotate 2deg |

### Mejoras visuales específicas por módulo

**Dashboard:**
- KPI cards con sparkline inline (mini gráfica de tendencia en 7px de alto)
- Área de Recharts con gradiente `accent/20 → transparent`
- Header con fecha y saludo personalizado al comercial

**Prospectos / Clientes:**
- Pipeline visual tipo "barra de progreso" por etapa arriba de la tabla
- Filtros flotantes como chips removibles (`x` por filtro activo)
- Avatar con iniciales + color hash por comercial asignado

**Detalle de Record:**
- Timeline de actividades con línea vertical `accent` + dots
- Sticky header con nombre de empresa mientras scrolleas
- Mini-kanban de cotizaciones en la ficha (por estado)

**Cotizaciones — Wizard:**
- Step bar animado con check al completar cada paso
- Preview live de la cotización al llenar datos (panel derecho)
- Número COT-XXX generado con animación de "stamp"

**Login:**
- Partículas suaves de fondo (CSS puro, sin librería)
- Logo ZYMO con glow `accent` pulsante lento

### Tokens de diseño a aplicar consistentemente
```css
/* Espaciado interno de cards */
--card-padding: 1.5rem;
/* Border radius consistente */
--radius-card: 0.75rem;    /* rounded-xl */
--radius-badge: 9999px;    /* rounded-full */
/* Transición global */
--transition: all 0.2s ease-in-out;
```

---

## 4. FIX DE CSS — QUÉ SE CAMBIÓ

| Problema | Causa | Solución |
|----------|-------|----------|
| `text-text` no resuelto en `@apply` | Dos configs coexistiendo: PostCSS leía `tailwind.config.js` (sin el color `text`) e ignoraba `tailwind.config.ts` | Unificado en `tailwind.config.js` con color renombrado a `foreground` |
| Color `text` conflicto namespace | `text-` es namespace reservado en Tailwind (text-sm, text-lg) | Renombrado a `foreground` → `text-foreground` |

**Build post-fix:** ✅ 167 módulos, 0 errores, 5.52s

---

## 5. PRÓXIMAS TAREAS (orden de prioridad)

1. ✅ Fix CSS Build — **DESBLOQUEADO**
2. 🔴 **Dashboard** — KPIs + Recharts (instalar skill `ansanabria/skills@recharts` primero)
3. 🔴 **Prospectos** — Tabla filtrable con pipeline visual
4. 🔴 **Clientes** — Tabla con estado + facturación
5. 🔴 **Detalle** — Ficha completa con timeline
6. 🔴 **Registro** — Formulario nuevo prospecto
7. 🟡 **Cotizaciones** — Lista + Wizard 5 pasos
8. 🟡 **Biblioteca** — Editor árbol inline
9. 🟡 **CRM Kanban** — Drag & drop pipeline
10. 🟡 **Equipo** — CRUD comerciales
11. 🟢 SAC, Usuarios, Import
12. 🔵 (Últimas) MCPs automatización


# M8 — Mapa de conexiones entre módulos (SOLO INVESTIGACIÓN)

**Agente:** Minimax  
**ID tarea:** **M8**  
**Tipo:** Investigación / auditoría de integración — **CERO implementación**  
**Prioridad:** Alta (bloquea confianza en Fase 2+)  
**Entregable:** `docs/orquestacion/reportes/REPORTE-MINIMAX-M8-CONEXIONES.md`

---

## ⛔ RESTRICCIONES ABSOLUTAS (leer primero)

Esta tarea es **exclusivamente de lectura e investigación**. No está autorizado cambiar nada.

| Prohibido | Permitido |
|-----------|-----------|
| Editar cualquier archivo del repo | Leer código, docs, grafo Obsidian |
| `git commit`, `git push`, branches | Buscar con grep/ripgrep, leer archivos |
| `docker compose`, Dockerfiles, `.env` | Navegar `:82` **solo para observar** (opcional) |
| Crear/modificar `.ts`, `.tsx`, `.css`, `.md` excepto el reporte | Escribir **únicamente** el reporte final |
| Refactors, fixes, “arreglos rápidos” | Documentar hallazgos y recomendaciones para otros agentes |
| Tocar `prisma/schema.prisma` o migraciones | Comparar schema vs uso real en servicios |

**Si encuentras un bug:** documéntalo en el reporte con severidad y archivo/línea. **No lo corrijas.**

**Si el reporte no existe al cerrar la tarea, la tarea NO está completa.**

---

## Comando para el humano (pegar en chat Minimax)

```
Ejecuta M8 — SOLO INVESTIGACIÓN, sin tocar código.

Lee docs/orquestacion/agentes/MINIMAX-M8-MAPA-CONEXIONES.md completo.
Entrega docs/orquestacion/reportes/REPORTE-MINIMAX-M8-CONEXIONES.md

⛔ PROHIBIDO: editar archivos del repo (excepto tu reporte), docker, commits, fixes.
```

---

## Objetivo

Construir un **mapa exhaustivo** de cómo se conectan **todos los módulos** del CRM React/Node:

1. **Qué módulos existen** (frontend, backend, DB, HTML de referencia).
2. **Cómo se enlazan** entre sí (navegación UI, APIs, FKs Prisma, side-effects en servicios).
3. **Si esas conexiones están bien implementadas** o hay roturas, huecos, duplicación o desalineación con el HTML/grafo de negocio.

El líder (Cursor) usará tu reporte para priorizar fixes en Codex/Claude/Cursor — **tú no ejecutas fixes**.

---

## Alcance — inventario de módulos

Debes cubrir **todos** estos módulos (ruta React → backend → tablas):

| # | Módulo | Ruta FE | Backend | Tablas Prisma principales |
|---|--------|---------|---------|---------------------------|
| 0 | Auth / Login | `/login` | `auth` | `User` |
| 1 | Dashboard | `/dashboard` | `dashboard` | `Record`, agregaciones |
| 2 | Registro | `/registro`, `/registro/importar` | `records` | `Record`, `Contacto` |
| 3 | Prospectos | `/prospectos`, `/detalle/:id` | `records` | `Record` (tipo=prospecto) |
| 4 | CRM Kanban | `/crm` | `crm`, `records` | `Record`, `CrmMeta` |
| 5 | Clientes | `/clientes`, `/clientes/:id` | `records` | `Record` (tipo=cliente) |
| 6 | Detalle unificado | `/detalle/:id` | `records`, `actividades`, `cotizaciones` | `Record`, `Actividad`, `Cotizacion` |
| 7 | Equipo | `/equipo` | `comerciales`, `usuarios` | `Comercial`, `User` |
| 8 | Cotizaciones | `/cotizaciones`, wizard, `/cot/:numero` | `cotizaciones` | `Cotizacion`, `CotNumeroCounter` |
| 9 | Biblioteca | `/biblioteca` | `biblioteca` | `BibliotecaLinea/Grupo/Item/Obs` |
| 10 | Matriz Riesgos | `/matriz-riesgos` | `matriz-riesgos` | `MatrizRiesgo` |
| 11 | Gestión Documental | `/gestion-documental` | `gestion-documental` | `GestionDocumental` |
| 12 | Preliquidador | `/preliquidador` | `preliq-historial` (+ lectura biblioteca/cotizaciones) | `PreliqHistorial` |
| 13 | Calendario | `/calendario` | `actividades` | `Actividad`, `Record` |
| 14 | Cotizador Paqueteo | `/cotizador` | (¿solo FE?) | — |
| 15 | Fichas SOP | `/fichas`, `/fichas/:recordId` | `fichas` | `FichaCliente`, `Analista` |
| 16 | SAC | `/sac` | `sac` | `Contacto`, `Record` |
| 17 | Usuarios (admin) | ruta protegida en `App.tsx` | `usuarios` | `User` |

**Fuentes obligatorias de lectura:**

- `frontend/src/App.tsx` — rutas y guards
- `frontend/src/api/*.ts` — contratos FE → BE
- `backend/src/modules/*/` — routers + services
- `backend/prisma/schema.prisma` — relaciones reales
- `grafo-obsidian/` — especialmente:
  - `Motores_de_Datos.md`
  - `Estados_del_Proceso.md`
  - `Pipeline_Prospectos.md`
  - `Pipeline_Cotizaciones.md`
  - `Reglas_de_Negocio.md`
  - `Alertas_y_Triggers.md`
  - nodos de cada módulo BASC/herramienta
- `docs/_html-extract/` o HTML v6 — flujos de referencia (solo lectura)
- `docs/orquestacion/ROADMAP-PARIDAD-HTML.md`

---

## Dimensiones de conexión a auditar

Para **cada par de módulos relacionados**, documenta estas 6 capas:

### A. Navegación UI (frontend)

- Links `<Link>`, `navigate()`, botones que llevan a otro módulo
- Query params compartidos (`?recordId=`, filtros, tabs)
- Sidebar / menú — ¿el módulo está en nav y la ruta existe?

**Ejemplos a verificar:**

- Prospectos → Detalle → Cotizaciones tab → wizard nueva cotización
- CRM card click → `/detalle/:id`
- Clientes → Matriz / Gestión doc (si existe enlace)
- Registro → ¿aparece en Prospectos y CRM al crear?
- Convertir prospecto → cliente (`POST convert-to-cliente`) → ¿refleja en Clientes, desaparece de Prospectos/CRM?

### B. API / contratos HTTP

- ¿La página llama endpoints que existen en backend?
- ¿Params/body coinciden con lo que el router valida (Zod)?
- ¿Respuestas incluyen datos que otra pantalla necesita (ej. `record.contactos`, `actividades`)?
- Endpoints huérfanos (existen en BE, ningún FE los usa)
- Endpoints faltantes (FE llama ruta que no existe → 404)

**Archivos clave:** `frontend/src/api/*`, `backend/src/modules/*/*.routes.ts`, registro de routers en `backend/src/app.ts` o equivalente.

### C. Modelo de datos (Prisma)

- FKs: `recordId`, `comercialId`, `cotizacion.recordId`, etc.
- Cascadas delete — ¿eliminar Record rompe cotizaciones/ficha/matriz?
- Campos JSON (`stageHistory`, `facturacionLineas`, `data` en FichaCliente)
- Unificación Record prospecto/cliente — mismos IDs al convertir

### D. Side-effects en servicios (lógica de negocio)

Busca en `*.service.ts` llamadas cruzadas entre módulos:

| Trigger | Side-effect esperado (grafo/HTML) | ¿Implementado? |
|---------|-----------------------------------|----------------|
| Crear prospecto | visible en Prospectos + CRM pipeline | |
| Cambiar `estadoProspecto` en CRM | `CrmMeta`, `stageHistory` | |
| `estadoProspecto === facturado` o botón convertir | `tipo: cliente`, matriz riesgos, actividad log | |
| Aprobar cotización | ¿avanza prospecto? ¿alerta? | |
| Crear cliente / convertir | `getOrCreateMatriz`, `getOrCreateGestionDocumental` | |
| Actividad tipo visita | ¿Calendario la muestra? | |
| Contacto SAC cumpleaños | ¿SAC filtra por mes? | |

### E. Catálogos compartidos (anti-hardcode)

- `frontend/src/lib/htmlV6/constants.ts`, `domainConfig.ts`
- ¿Módulos usan la misma fuente para estados, badges, servicios, compañías?
- ¿Hay arrays duplicados que desincronizan pipeline CRM vs Detalle vs Prospectos?

### F. Paridad HTML vs React (solo diagnóstico)

- ¿El flujo HTML conectaba módulos que React aún no enlaza?
- Referencia: funciones en `docs/_html-functions.txt`, análisis `docs/_html-analysis.json`

---

## Flujos transversales obligatorios (trazar end-to-end)

Debes documentar **cada paso** de estos flujos con archivos concretos:

### Flujo 1 — Lead → Cliente activo

```
Registro (prospecto) → Prospectos list → CRM Kanban → Detalle →
Actividades → Cotización (wizard) → estados pipeline →
Convertir a cliente → Clientes list → Matriz Riesgos → Gestión Documental → Ficha SOP
```

Preguntas:

- ¿Se pierde data en algún salto?
- ¿IDs consistentes?
- ¿Automatismos del HTML faltan en React?

### Flujo 2 — Cotización comercial

```
Biblioteca (tarifas) → Cotizaciones wizard → Preliquidador (opcional) →
Cotización pública /cot/:numero → estado aprobada → impacto en Record
```

### Flujo 3 — Seguimiento comercial

```
Actividad en Detalle → Calendario → Dashboard KPIs / ranking → SAC contactos
```

### Flujo 4 — BASC compliance

```
Cliente activo → Matriz (scoring) → Gestión Documental (18 docs) →
¿alertas vencimiento? → ¿visible en listados filtrados?
```

### Flujo 5 — Equipo y permisos

```
User login → rol/permisos → filtro por comercialId en listados →
Equipo CRUD → ¿afecta comercial asignado en Records?
```

---

## Matriz de pares a completar (mínimo)

Completa una fila por cada celda **no trivial** (marca N/A si no aplica):

| Desde → Hacia | UI | API | DB | Side-effect | Estado |
|---------------|----|----|----|----|--------|
| Registro → Prospectos | | | | | ✅ / ⚠️ / ❌ / N/A |
| Registro → CRM | | | | | |
| Prospectos → Detalle | | | | | |
| CRM → Detalle | | | | | |
| Detalle → Cotizaciones | | | | | |
| Detalle → Actividades | | | | | |
| Prospecto → Cliente (convert) | | | | | |
| Cliente → Matriz | | | | | |
| Cliente → Gestión Doc | | | | | |
| Cliente → Ficha | | | | | |
| Cotizaciones → Biblioteca | | | | | |
| Cotizaciones → Record estado | | | | | |
| Preliquidador → Biblioteca | | | | | |
| Preliquidador → Historial | | | | | |
| Calendario → Actividades | | | | | |
| Dashboard → Records | | | | | |
| SAC → Contactos/Record | | | | | |
| Equipo → Comerciales | | | | | |
| Import wizard → Records | | | | | |

**Estado:**

- ✅ Conectado y coherente con grafo/HTML
- ⚠️ Conectado pero con gaps (documentar cuál)
- ❌ Roto o ausente
- N/A No aplica en este sistema

---

## Metodología recomendada (orden de trabajo)

### Fase 1 — Mapa estático (4–6 h)

1. Listar todas las rutas en `App.tsx`
2. Listar todos los routers backend y montaje en app
3. Leer `schema.prisma` y dibujar diagrama entidad-relación (mermaid en reporte)
4. Leer `grafo-obsidian/Motores_de_Datos.md` y contrastar endpoints documentados vs código

### Fase 2 — Mapa dinámico FE (4–6 h)

1. Por cada `frontend/src/pages/*.tsx`, listar imports de `api/*` y navegación
2. Por cada `frontend/src/api/*.ts`, anotar endpoints usados
3. Detectar APIs sin consumidor y páginas sin backend

### Fase 3 — Side-effects BE (3–4 h)

1. Leer cada `*.service.ts` buscando `import` de otros módulos
2. Documentar triggers automáticos (convert, getOrCreate*, stageHistory, etc.)
3. Comparar con `Estados_del_Proceso.md` y `Alertas_y_Triggers.md`

### Fase 4 — Flujos E2E en papel (2–3 h)

1. Recorrer los 5 flujos transversales
2. Opcional: login en `:82` y confirmar navegación (sin modificar datos de prod; usar QA)

### Fase 5 — Síntesis (2 h)

1. Top 10 conexiones rotas (severidad alta)
2. Top 10 desalineaciones HTML/React
3. Top 10 deuda de integración (endpoints huérfanos, duplicación catálogos)
4. Recomendaciones **por agente** (@CODEX, @CLAUDE, @CURSOR) — sin implementar

---

## Formato del reporte entregable

Crear **`docs/orquestacion/reportes/REPORTE-MINIMAX-M8-CONEXIONES.md`** con esta estructura:

```markdown
# REPORTE M8 — Mapa de conexiones entre módulos

**Fecha:** YYYY-MM-DD
**Agente:** Minimax
**Modo:** Solo investigación (sin cambios en repo)

## 1. Resumen ejecutivo (≤ 15 líneas)

## 2. Diagrama ER Prisma (mermaid)

## 3. Diagrama módulos FE ↔ BE (mermaid)

## 4. Inventario por módulo (tabla: ruta, APIs, tablas, páginas relacionadas)

## 5. Matriz de pares (completa)

## 6. Flujos transversales (5 flujos, paso a paso con archivos)

## 7. Hallazgos críticos (❌)

## 8. Hallazgos medios (⚠️)

## 9. Conexiones correctas destacables (✅)

## 10. Endpoints huérfanos / faltantes

## 11. Desalineación grafo Obsidian vs código

## 12. Desalineación HTML vs React (integración, no visual)

## 13. Recomendaciones por agente (sin implementar)

## 14. Anexo — archivos revisados (lista)

## 15. Confirmación de restricciones

- [ ] No modifiqué código fuente
- [ ] No ejecuté docker
- [ ] No hice commits
- [ ] Solo escribí este reporte
```

Incluir **rutas de archivo y números de línea** cuando cites un hallazgo.

---

## Criterios de Done (M8)

- [ ] Reporte completo en `reportes/REPORTE-MINIMAX-M8-CONEXIONES.md`
- [ ] Los 17 módulos del inventario cubiertos
- [ ] Matriz de pares completada (mínimo 19 filas de la tabla)
- [ ] 5 flujos transversales trazados con archivos
- [ ] Al menos 2 diagramas mermaid
- [ ] Lista priorizada de roturas (❌) con severidad
- [ ] Cero archivos modificados fuera del reporte
- [ ] Sección de confirmación de restricciones marcada

---

## Qué NO es esta tarea

- ❌ QA visual / capturas estéticas (eso es L5 / Codex)
- ❌ Paridad CSS HTML v6
- ❌ Arreglar bugs encontrados
- ❌ Actualizar grafo Obsidian (solo reportar desalineaciones)
- ❌ Escribir tests

---

## Escalamiento

| Situación | Acción |
|-----------|--------|
| Bug crítico de seguridad | Reporte + marcar 🔴 CRÍTICO; avisar @CURSOR en reporte |
| Conexión rota bloquea negocio | Prioridad P0 en recomendaciones |
| Duda de regla de negocio | Citar grafo + HTML; marcar "requiere aval humano" |
| Tarea > 20h | Entregar reporte parcial por flujos 1–3; continuar en M8b |

---

*Autor: Cursor (líder) · Sprint Fase 2 · 2026-06-22*

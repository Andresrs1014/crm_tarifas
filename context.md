# CRM Tarifas — Grupo ZYMO
## Contexto del Proyecto
CRM comercial para seguimiento de prospectos, clientes y cotizaciones de tarifas logísticas.
Basado en un prototipo HTML+JS (crm_oscar.html) que se está convirtiendo en sistema de producción.

## Stack
- **Backend:** FastAPI + SQLModel + SQLite + Alembic + JWT (python-jose + passlib bcrypt)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand + TanStack Query + React Router v6
- **Deploy:** Docker + docker-compose (backend:8000, frontend:5173)

## Estructura del Proyecto
```
crm_tarifas/
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── seed.py               ← siembra biblioteca y servicios al iniciar
│       ├── auth/ (router, service, dependencies)
│       ├── models/  (user, record, contacto, actividad, comercial, biblioteca, cotizacion)
│       ├── routers/ (records, contactos, actividades, comerciales, biblioteca, cotizaciones, dashboard)
│       └── schemas/
├── frontend/
│   └── src/
│       ├── api/          (records, comerciales, biblioteca, cotizaciones)
│       ├── components/   (Layout, PageContainer, ServiceChip, Badge, BillingLines,
│       │                  ContactosList, ActividadesTimeline, ConfirmModal, Toast)
│       ├── pages/
│       │   ├── Login, Dashboard, Prospectos, Clientes, Equipo
│       │   ├── Registro.tsx      ← layout ancho con PageContainer + grid 3 cols
│       │   ├── Detalle.tsx
│       │   ├── Cotizaciones.tsx
│       │   ├── Biblioteca.tsx    ← acordeón por línea, tabs: Grupos&Items / Obs / Columnas
│       │   ├── CotPublica.tsx    ← ruta pública /cot/:numero sin navbar
│       │   └── wizard/
│       │       ├── WizardLayout.tsx
│       │       ├── Paso1.tsx  (datos generales + autocomplete empresa)
│       │       ├── Paso2.tsx  (selección de líneas)
│       │       ├── Paso3.tsx  (items por grupo, edición inline)
│       │       ├── Paso4.tsx  (observaciones plantillas + libre)
│       │       └── Paso5.tsx  (preview HTML + guardar/enviar)
│       ├── store/
│       │   ├── authStore.ts
│       │   ├── toastStore.ts
│       │   └── cotWizardStore.ts  ← store complejo, ver sección abajo
│       ├── types/index.ts
│       ├── utils/
│       │   ├── format.ts
│       │   └── cotizacion.ts     ← buildCotHTML()
│       └── App.tsx
├── docker-compose.yml
├── .env
└── docs/
    ├── PENDIENTES.md             ← pendientes Fase 9
    └── ...fases anteriores
```

## Roles de Usuario
- **superadmin:** Acceso total + puede crear/eliminar usuarios, ver tab "Columnas extra" en Biblioteca
- **usuario normal:** Acceso completo al CRM, sin gestión de usuarios
- Primer superadmin se crea automático desde `.env`: `FIRST_SUPERADMIN_USERNAME` / `FIRST_SUPERADMIN_PASSWORD`
- Credenciales actuales: `Analista_Desarrollo` / `Admin1234!`

## Fases — Estado actual
- [x] Fase 0 — Setup: estructura, docker-compose, FastAPI base, SQLite
- [x] Fase 1 — Auth: modelo users, JWT, endpoints /token /register /me, superadmin automático
- [x] Fase 2 — Core Backend: modelos y CRUD de comerciales, records, contactos, actividades
- [x] Fase 3 — Biblioteca: líneas, grupos, ítems, observaciones, seed data
- [x] Fase 4 — Cotizaciones: wizard, numeración atómica, duplicar, actualizar tarifas, link público
- [x] Fase 5 — Dashboard: agregaciones SQL para KPIs y gráficos
- [x] Fase 6 — Frontend Base: login, routing protegido, layout sidebar + header reloj
- [x] Fase 7 — Páginas Core: dashboard, prospectos, clientes, equipo, registro, detalle
- [x] Fase 8 — Cotizaciones FE: cotWizardStore, wizard 5 pasos, buildCotHTML, export PDF, CotPublica
- [x] Fase 9 (parcial) — Biblioteca UI: acordeón, CRUD grupos/items/obs/columnas
- [ ] Fase 9 (pendiente) — Ver docs/PENDIENTES.md

## Decisiones Técnicas Importantes
- **SQLite sobre PostgreSQL:** proyecto pequeño, sin overhead de servicio separado
- **items_snapshot en cotizaciones:** deep clone JSON al guardar — cotizaciones pasadas nunca cambian aunque cambien tarifas de biblioteca
- **Numeración cotizaciones:** tabla `cot_numero_counter` con operación atómica → COT-001, COT-002...
- **cotWizardStore (Zustand):** store complejo de 5 pasos. `initItemsFromBiblioteca` solo hidrata líneas nuevas, preserva edits. `sel=false` default (opt-in). `buildCotPayload()` es función pura exportada.
- **Tarifas como VARCHAR:** pueden ser '559.900' o '0,36%', nunca como número
- **SERVICIO_COLORS:** fuente de verdad única en `types/index.ts`. Colores correctos:
  - Zona Franca: #00c2ff | Depósito Aduanero: #f5a623 | CEDI: #f5a623
  - Transporte: #00e676 | Paqueteo: #a855f7 | Aduana: #ff4444
- **PageContainer:** componente wrapper `maxWidth:1400, margin:auto, padding:28px 32px` — usado en todas las páginas principales
- **ServiceChip props:** `label` (string) y `onToggle` (fn) — NO `service`/`onClick`
- **lineasDisponibles fallback:** `biblioteca.length > 0 ? biblioteca.map(l => l.nombre) : [...SERVICIOS]` — evita chips vacíos mientras carga la query

## Servicios Logísticos (constantes del sistema)
Zona Franca · Depósito Aduanero · CEDI · Transporte · Paqueteo · Aduana
Definidos en `SERVICIOS` array y `SERVICIO_COLORS` record en `frontend/src/types/index.ts`

## Layout / UI
- Sidebar izquierdo fijo (w-56), fondo #111827, border-r
- Header top con reloj en tiempo real (fecha color #00c2ff, hora #8899b4)
- Fondo app: #0a0e1a | Surface: #111827 | Surface2: #1a2235 | Border: #1e3050
- Accent: #00c2ff | Danger: #ff4444 | Success: #00e676 | Muted: #8899b4
- Nav item "Servicios" → ruta `/biblioteca`
- Font condensed: usado en títulos y labels de sección

## cotWizardStore — Resumen
```typescript
// Tipos clave
type ItemsMap = Record<string, Record<string, WizardGrupo>>
// [linea_nombre][grupo_nombre] = WizardGrupo

interface WizardItem {
  id: string; nombre: string; tarifa: string; tipo_tarifa: 'moneda'|'porcentaje'
  obs: string; extra_cols: Record<string, string>; sel: boolean
}
interface WizardGrupo { nombre: string; items: WizardItem[]; sel: boolean }

// Acciones principales
setPaso, setDatosGenerales, toggleLinea
initItemsFromBiblioteca(biblioteca)  // llamar al pasar Paso2→Paso3
toggleGrupo, toggleItem, updateItemField, updateItemExtraCol
toggleObsPlantilla, setObsLibre
resetWizard, loadFromCotizacion(cot, biblioteca)

// Función pura exportada
buildCotPayload(state): CotizacionCreate
```

## buildCotHTML
- Ubicación: `frontend/src/utils/cotizacion.ts`
- Firma: `buildCotHTML(wiz: CotWizardState, comercial: string, biblioteca: BibliotecaLinea[]): string`
- Genera HTML completo con clases `.cot-preview`, `.cot-tabla`, `.cot-obs-box`
- CSS de impresión en `index.css` → `@media print` oculta todo excepto `.cot-preview`

## Módulos del CRM
Dashboard · Registro · Prospectos · Clientes · Detalle/Edición · Equipo Comercial
Cotizaciones (wizard 5 pasos) · Biblioteca de Servicios · Vista pública cotización · Carga Masiva (PENDIENTE)

## PARA TENER MUY EN CUENTA
- En la raíz hay `crm_oscar.html` — prototipo original, fuente de verdad de lógica de negocio
- El HTML tiene navbar horizontal; el React tiene sidebar vertical — usuario prefiere sidebar
- La app está 100% funcional y probada en Docker. Retomar desde docs/PENDIENTES.md

## Archivos clave para onboarding rápido
1. `crm_oscar.html` — prototipo base
2. `docs/DATA_MODEL.md` — modelos y relaciones
3. `frontend/src/types/index.ts` — todos los tipos TS y constantes
4. `frontend/src/store/cotWizardStore.ts` — store más complejo
5. `docs/PENDIENTES.md` — qué falta por hacer

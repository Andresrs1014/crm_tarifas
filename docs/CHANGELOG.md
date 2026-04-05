# CHANGELOG — CRM Tarifas ZYMO

Trazabilidad de todos los cambios implementados a partir de la comparación entre el proyecto actual y el prototipo `crm_nuevo.md`.

---

## [2026-04-03] — Fase 1: Migraciones de Base de Datos

### Modelos actualizados

#### `backend/app/models/record.py`
- **Añadido** `direccion: Optional[str]` — dirección física del cliente/prospecto
- **Añadido** `categoria: Optional[str]` — categoría A/B/C del record

#### `backend/app/models/contacto.py`
- **Añadido** `cumpleanos: Optional[date]` — fecha de cumpleaños del contacto (usado en SAC)
- **Añadido** `recibe_regalos: Optional[str]` — si el contacto recibe regalos (si/no/tal_vez)
- **Añadido** `fotos_entrega: Optional[str]` — JSON list[str] con rutas de fotos de entrega de regalos
- **Añadido** `fotos_fda: Optional[str]` — JSON list[str] con rutas de fotos de fin de año
- **Añadido** `fda_entregado: Optional[bool]` — flag si el regalo de fin de año fue entregado
- **Añadido** `direccion: Optional[str]` — dirección del contacto

#### `backend/app/models/cotizacion.py`
- **Añadido** `paqueteadora: Optional[str]` — nombre de la empresa paqueteadora (para servicio Paqueteo)
- **Añadido** `tarifa_tipo: Optional[str]` — JSON dict indicando tipo de tarifa por línea (biblioteca/especial)
- **Añadido** `tarifa_especial_id: Optional[str]` — JSON dict mapeando línea → id de TarifaEspecial

### Nuevos modelos

#### `backend/app/models/tarifa_especial.py` (nuevo)
- Tabla `tarifas_especiales` con campos: id, nombre, servicio, grupos (JSON), created_at, updated_at
- Permite guardar conjuntos de tarifas personalizadas por servicio, seleccionables en el wizard de cotizaciones

### Schemas actualizados

#### `backend/app/schemas/record.py`
- `RecordCreate` / `RecordUpdate` / `RecordRead`: añadidos `direccion`, `categoria`

#### `backend/app/schemas/contacto.py`
- `ContactoCreate` / `ContactoUpdate` / `ContactoRead`: añadidos `cumpleanos`, `recibe_regalos`, `fotos_entrega`, `fotos_fda`, `fda_entregado`, `direccion`

#### `backend/app/schemas/cotizacion.py`
- `CotizacionCreate` / `CotizacionUpdate` / `CotizacionRead`: añadidos `paqueteadora`, `tarifa_tipo`, `tarifa_especial_id`
- **Nuevo schema** `TarifaEspecialCreate` / `TarifaEspecialRead`

### Infraestructura de migración

#### `backend/app/database.py`
- **Añadido** `apply_migrations()` — función que ejecuta ALTER TABLE para columnas nuevas en DBs existentes (SQLite no soporta ADD COLUMN IF NOT EXISTS, se usa PRAGMA table_info para verificar)

#### `backend/app/main.py`
- Importa `TarifaEspecial` para registro en metadata
- Llama `apply_migrations()` en el lifespan antes de `create_db_and_tables()`
- Registra router de `tarifas_especiales`

### Routers actualizados

#### `backend/app/routers/records.py`
- `ImportRow`: añadidos `direccion`, `categoria` en la importación masiva

#### `backend/app/routers/contactos.py`
- CRUD de contactos acepta y devuelve los nuevos campos SAC

### Nuevos routers

#### `backend/app/routers/tarifas_especiales.py` (nuevo)
- `GET /tarifas-especiales/` — listar todas (filtrable por servicio)
- `POST /tarifas-especiales/` — crear nueva tarifa especial
- `GET /tarifas-especiales/{id}` — obtener por ID
- `PUT /tarifas-especiales/{id}` — actualizar
- `DELETE /tarifas-especiales/{id}` — eliminar

---

## [2026-04-04] — Fase 4 (parcial): Correcciones y funcionalidades del wizard

### Fix crítico — Detalle.tsx: contactos no se guardaban en actualización

#### `backend/app/schemas/record.py`
- **Añadido** `contactos: Optional[list[ContactoCreate]] = None` a `RecordUpdate`
  - Permite enviar la lista completa de contactos al actualizar un record

#### `backend/app/routers/records.py`
- **Actualizado** `update_record()`: si `contactos` está presente en el payload, elimina los contactos existentes del record y los reemplaza con los nuevos (delete + re-insert)
- Operación es atómica — usa `session.flush()` entre el delete y el insert

#### `frontend/src/pages/Detalle.tsx`
- **Fix** `handleSave()`: añadido `contactos` al payload enviado al backend
- Los campos SAC de contactos (`cumpleanos`, `recibe_regalos`, `direccion`) ahora persisten correctamente al editar un record

### Paso3.tsx — Selector de Paqueteadora

#### `frontend/src/store/cotWizardStore.ts`
- **Añadido** `paqueteadora: string | null` al estado inicial del wizard
- **Añadido** acción `setPaqueteadora(val: string | null)`
- **Actualizado** `buildCotPayload()` para incluir `paqueteadora`
- **Actualizado** `loadFromCotizacion()` para restaurar `paqueteadora` al editar

#### `frontend/src/pages/wizard/Paso3.tsx`
- **Añadido** selector visual de paqueteadora (COORDINADORA / TCC / SERVIENTREGA)
- Solo visible cuando "Paqueteo" está entre las líneas seleccionadas
- Botones toggle — un clic selecciona, otro deselecciona

### Cotizaciones.tsx — Modal "Actualizar Tarifas"

#### `frontend/src/pages/Cotizaciones.tsx`
- **Importado** `actualizarTarifasApi` y `TrendingUp` icon
- **Añadido** botón "Actualizar tarifas" (TrendingUp) en acciones de cada fila
- **Añadido** modal con:
  - Input de porcentaje de incremento (default 5%)
  - Lista de ítems tipo moneda del snapshot con checkboxes
  - Toggle "Seleccionar todos / Deseleccionar todos"
  - Crea una nueva cotización con tarifas actualizadas (no modifica la original)
- **Añadida** función helper `extractMonedaItems()` para obtener nombres de ítems tipo moneda del snapshot

---

## [2026-04-04] — Fase 3 (cont.): Paso2 — Selector de tarifa por línea

### Wizard Paso 2: tarifa especial / biblioteca

#### `frontend/src/store/cotWizardStore.ts`
- **Añadido** `setTarifaTipo(svc, tipo)` — establece si la línea usa 'biblioteca' o 'especial'
- **Añadido** `setTarifaEspecialId(svc, id)` — guarda el UUID de la tarifa especial seleccionada
- **Actualizado** `buildCotPayload()` para incluir `tarifa_tipo` y `tarifa_especial_id`
- **Actualizado** `loadFromCotizacion()` para restaurar ambos campos desde la cotización existente

#### `frontend/src/pages/wizard/Paso2.tsx`
- **Añadida** sección "Fuente de tarifas por línea" — visible solo cuando hay líneas seleccionadas
- Por cada línea activa: toggle `Biblioteca estándar` / `Tarifa especial`
- Al elegir "Tarifa especial": dropdown filtrado por servicio usando `getTarifasEspeciales()`
- Si no hay tarifas especiales para ese servicio, muestra mensaje informativo
- Default: `biblioteca` para todas las líneas

---

---

## [2026-04-04] — Fase 4: Equipo.tsx — Ranking de Gestión

### Ranking de gestión por comercial

#### `backend/app/schemas/dashboard.py`
- **Añadido** `RankingEntry` schema: `comercial_id`, `nombre`, `prospectos`, `clientes`, `visitas`, `valor_facturado`

#### `backend/app/routers/dashboard.py`
- **Añadido** `GET /dashboard/ranking` — devuelve lista de `RankingEntry` ordenada por clientes DESC, prospectos DESC
- Calcula prospectos, clientes, actividades (visitas) y suma de `valor + valor_p` por comercial activo

#### `frontend/src/types/index.ts`
- **Añadido** interfaz `RankingEntry`

#### `frontend/src/api/dashboard.ts`
- **Añadido** `getRankingApi()` — llama `GET /api/dashboard/ranking`

#### `frontend/src/pages/Equipo.tsx`
- **Añadido** query `ranking` usando `getRankingApi()`
- **Añadido** sección "Ranking de Gestión" al final de la página
- Cards con medalla (oro/plata/bronce) para posiciones 1–3
- Cada card muestra: Prospectos, Clientes, Visitas, Facturado (formateado como $XM / $XK)
- Grid responsive 1–3 columnas

---

## [2026-04-04] — Fase 3 (cont.): WizardLayout — Autosave silencioso de borrador

### Autosave en cada paso del wizard

#### `frontend/src/pages/wizard/WizardLayout.tsx`
- **Importado** `useRef`
- **Añadido** `autosavingRef` — ref para prevenir guardados concurrentes
- **Añadido** `handleAutosave()` — función async que guarda silenciosamente sin toast ni navegación:
  - Si `state.id` existe: llama `updateCotizacionApi` con `estado: 'borrador'`
  - Si no existe `state.id`: llama `createCotizacionApi` y almacena `id`/`numero` en el store via `useCotWizardStore.setState`
  - Errores silenciados — no interrumpen al usuario
- **Actualizado** `handleNext()`: llama `void handleAutosave()` (fire-and-forget) tras avanzar el paso

---

---

## [2026-04-04] — Fases 2, 3, 4 completadas

### Fase 2 — SAC.tsx

- `frontend/src/pages/SAC.tsx` — módulo completo implementado
  - Tracking de cumpleaños por mes con KPI cards y selector de mes
  - Registro de fotos de entrega de regalos (modal, base64 FileReader)
  - Sección Fin de Año con selección y control de entregas
  - Exportación XLSX con SheetJS (import dinámico)
- `backend/app/routers/sac.py` — `GET /sac/contactos` + `PATCH /sac/contactos/{id}/fotos`
- `frontend/src/api/sac.ts` — `getSACContactos` + `updateFotos`
- `frontend/src/components/Layout.tsx` — SAC en nav con ícono `HeartHandshake`
- `frontend/src/App.tsx` — ruta `/sac` registrada

### Fase 3 — Cotizaciones

- `WizardLayout.tsx`: autosave silencioso con `useRef` guard en cada paso
- `Paso2.tsx`: selector tarifa especial / biblioteca por línea (toggle + dropdown filtrado)
- `Paso3.tsx`: selector de paqueteadora (COORDINADORA / TCC / SERVIENTREGA) cuando Paqueteo activo
- `Cotizaciones.tsx`: acción "Duplicar cotización" (Copy icon, `duplicarCotizacionApi`)
- `Cotizaciones.tsx`: badges de estado coloreados con `ESTADO_COLORS` map
- `Cotizaciones.tsx`: modal "Actualizar Tarifas" con incremento porcentual y selección de ítems
- Backend: `POST /cotizaciones/{id}/duplicar` + `POST /cotizaciones/{id}/actualizar-tarifas`

### Fase 4 — Páginas existentes

- `Registro.tsx`: campos `direccion`, `categoria`, `cumpleanos`, `recibe_regalos` por contacto
- `Prospectos.tsx` / `Clientes.tsx`: badge de categoría inline con empresa
- `Detalle.tsx`: `direccion`, `categoria` en vista y edición; `cumpleanos`, `recibe_regalos` en vista de contactos
- `ContactosList.tsx`: campos SAC por contacto en modo edición
- `Equipo.tsx`: Ranking de Gestión con medallas y estadísticas (prospectos, clientes, visitas, facturado)

---

## Pendiente — Fase 3: Modal "Importar desde PDF"

- Modal "Importar desde PDF" con extracción de texto via pdf.js (diferido)

## Pendiente — Fase 5: Logo ZYMO

- Análisis de placement del logo (pendiente recibir el archivo de imagen)

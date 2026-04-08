# CHANGELOG — CRM Tarifas ZYMO

---

## [2026-04-08] — Sesión final: wizard, dashboard, exportaciones y PDF

### Bug crítico corregido — Registro de clientes
- `frontend/src/pages/Registro.tsx`: Zod rechazaba string vacío `""` en selects opcionales (`z.enum([...]).optional()` no acepta `""`). Fix: se agrega `''` a todos los arrays de enum opcionales → clientes y prospectos ahora se crean correctamente.

### Wizard de cotizaciones
- `WizardLayout.tsx`: "Guardar borrador" disponible en pasos 1–4 (antes solo en paso 5)
- `WizardLayout.tsx`: fix layout con `PageContainer` (contenido ya no queda pegado a la izquierda)
- `Paso1.tsx`: autocomplete de empresa ahora pre-rellena contacto, cargo, email, teléfono y comercial llamando `getRecord(id)` al seleccionar
- `Paso1.tsx`: selector de contacto aparece automáticamente cuando el cliente tiene múltiples contactos

### Importar desde PDF (nueva funcionalidad)
- `Cotizaciones.tsx`: modal "Importar desde PDF" con flujo completo:
  - Selección de línea de negocio
  - Upload de PDF (drag & drop o clic)
  - Extracción de texto vía pdf.js (cargado desde CDN, sin dependencia npm)
  - Parsing automático de grupos y tarifas (heurístico por posición Y + regex $, %)
  - Vista previa editable (nombres, tarifas, tipo $/%)
  - "Abrir en wizard" pre-rellena el store con los grupos extraídos

### Dashboard
- Filtro por tipo (prospecto / cliente) afecta todas las estadísticas
- Botón "Exportar Excel" exporta registros filtrados
- Estados vacíos con mensaje en charts de pipeline, comercial y líneas cotizadas
- Dots visibles en gráfica de registros por mes
- Altura corregida en Gestión de Clientes y registros por mes
- `DashboardStats`: añadidos `cotizaciones_en_curso?` y `cotizaciones_vencidas?` en types

### Exportar Excel
- `Prospectos.tsx`: botón "Exportar Excel" (todos los campos del registro)
- `Clientes.tsx`: botón "Exportar Excel" (todos los campos del registro)
- `frontend/src/utils/exportExcel.ts` (nuevo): funciones `exportProspectos`, `exportClientes`, `exportTodos` usando SheetJS

### Detalle de registro
- `Detalle.tsx`: botón "Nueva cotización" pre-rellena wizard con datos del cliente (empresa, NIT, comercial, contacto)
- `Detalle.tsx`: fix layout con `PageContainer`
- `Detalle.tsx`: guard `if (!record) return` en `handleSave` (fix TypeScript TS18048)

### Correcciones TypeScript
- `Equipo.tsx`: eliminada referencia a `setShowForm` inexistente
- `types/index.ts`: `DashboardStats` con campos opcionales `cotizaciones_en_curso` y `cotizaciones_vencidas`
- `Detalle.tsx`: guard de nulabilidad en `handleSave`

### Backend
- `backend/alembic/versions/0006_fecha_visita.py` (nueva migración): añade `fecha_visita` y `fecha_visita_cliente` a tabla `records`
- `backend/app/schemas/record.py`: todos los campos `Optional` en `RecordRead` tienen `= None` (fix Pydantic v2 — campos sin default eran requeridos)

---

## [2026-04-04] — Fases 1–4: Implementación completa del prototipo

### Fase 1 — Migraciones de base de datos
- `Record`: `direccion`, `categoria` (A/B/C)
- `Contacto`: `cumpleanos`, `recibe_regalos`, `fotos_entrega`, `fotos_fda`, `fda_entregado`, `direccion`
- `Cotizacion`: `paqueteadora`, `tarifa_tipo`, `tarifa_especial_id`
- Nuevo modelo `TarifaEspecial` con router CRUD completo
- `database.py`: `apply_migrations()` para ALTER TABLE seguro en SQLite

### Fase 2 — SAC (Servicio al Cliente)
- `SAC.tsx`: tracking cumpleaños, fotos de entrega, fin de año, exportación XLSX
- `backend/app/routers/sac.py`: `GET /sac/contactos` + `PATCH /sac/contactos/{id}/fotos`
- Ruta `/sac` registrada en App.tsx con ícono `HeartHandshake` en sidebar

### Fase 3 — Cotizaciones
- Wizard completo 5 pasos con autosave silencioso por paso
- `Paso2.tsx`: selector tarifa especial / biblioteca por línea
- `Paso3.tsx`: selector paqueteadora (COORDINADORA / TCC / SERVIENTREGA)
- `Cotizaciones.tsx`: duplicar cotización, actualizar tarifas con incremento porcentual
- Backend: `POST /cotizaciones/{id}/duplicar`, `POST /cotizaciones/{id}/actualizar-tarifas`
- Link público `/cot/:numero` (sin autenticación)

### Fase 4 — Páginas existentes
- `Registro.tsx`: campos `direccion`, `categoria`, `cumpleanos`, `recibe_regalos`
- `Detalle.tsx`: edición de todos los campos nuevos, contactos con datos SAC
- `Equipo.tsx`: ranking de gestión con medallas (oro/plata/bronce), stats por comercial
- Dashboard: `/api/dashboard/ranking`, `/api/dashboard/recientes`
- Carga masiva: `POST /api/records/import`, wizard 3 pasos en `/registro/importar`
- Gestión de usuarios: `/admin/usuarios` (solo superadmin)

---

## [2026-04-03] — Setup inicial del proyecto

- Estructura base FastAPI + React/Vite + Docker
- Modelos iniciales: `Record`, `Contacto`, `Cotizacion`, `Comercial`, `User`, `Biblioteca`
- Auth JWT con roles superadmin/usuario
- Docker Compose: backend + frontend (nginx proxy)
- Páginas base: Login, Dashboard, Prospectos, Clientes, Equipo, Cotizaciones, Biblioteca

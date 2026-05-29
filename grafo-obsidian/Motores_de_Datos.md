#motor

# Motores de Datos

> **Tipo:** Nodo de fuentes de datos e integraciones
> **Dependencias:** [[ZYMO_CRM_AGENT]] · [[Mente_ZYMO_SUBAGENT]] · [[KPIs_Tiempos]]

---

## Base de datos principal

**PostgreSQL 15** — Docker container en puerto `:5435`

Tablas principales:
| Tabla | Propósito |
|-------|-----------|
| `Record` | Prospectos y clientes (unificados) |
| `Contacto` | Contactos por registro |
| `Actividad` | Log de llamadas, visitas, emails, visitas |
| `Comercial` | Equipo comercial |
| `Cotizacion` | Cotizaciones con snapshot de tarifas |
| `CotNumeroCounter` | Secuencia atómica COT-001, COT-002... |
| `BibliotecaLinea` | Líneas de servicio en la Biblioteca |
| `BibliotecaGrupo` | Grupos dentro de cada línea |
| `BibliotecaItem` | Items con tarifa como string |
| `BibliotecaObs` | Observaciones predefinidas por línea |
| `CrmMeta` | Metadata del pipeline: timestamps por etapa |
| `User` | Usuarios del sistema con roles |
| `MatrizRiesgo` | Scoring BASC por record (puntaje, riesgo, companias) |
| `GestionDocumental` | Documentos BASC por record (18 docs, ciclo, cumplimiento) |

---

## API REST — Endpoints disponibles

**Base URL:** `https://crm.zymointranet.com/api`

### Records (Prospectos y Clientes)
- `GET /api/records` — lista con filtros (tipo, estado, comercialId, search)
- `GET /api/records/:id` — ficha completa con contactos y actividades
- `POST /api/records` — crear registro
- `PUT /api/records/:id` — actualizar campos
- `DELETE /api/records/:id` — eliminar
- `POST /api/records/import` — importación masiva Excel

### Cotizaciones
- `GET /api/cotizaciones` — lista con filtros
- `GET /api/cotizaciones/:id` — detalle
- `POST /api/cotizaciones` — crear
- `PUT /api/cotizaciones/:id` — actualizar/avanzar estado
- `POST /api/cotizaciones/:id/duplicar` — duplicar
- `GET /api/cot/:numero` — vista pública (sin auth)

### Actividades
- `GET /api/actividades` — lista con filtros (tipo, mes YYYY-MM, comercialId) — incluye record
- `POST /api/records/:recordId/actividades` — registrar actividad
- `PUT /api/actividades/:id` — actualizar (incluye marcar hecho, hora, lugar)
- `DELETE /api/actividades/:id` — eliminar

### Dashboard
- `GET /api/dashboard` — estadísticas globales
- `GET /api/dashboard/ranking` — ranking de comerciales
- `GET /api/dashboard/recientes` — últimos registros

### CRM Pipeline
- `GET /api/crm/pipeline` — prospectos por estado con meta
- `PUT /api/crm/:id/estado` — avanzar estado + registrar tiempo
- `GET /api/crm/actividades/vencidas` — actividades pendientes

### SAC
- `GET /api/sac/contactos?mes=N` — contactos por mes
- `PATCH /api/sac/contactos/:id/fotos` — actualizar FDA/fotos

### Biblioteca
- `GET /api/biblioteca` — árbol completo líneas→grupos→items
- CRUD completo: lineas, grupos, items, observaciones

### Comerciales
- `GET /api/comerciales` — lista activos
- `POST /api/comerciales` — crear
- `PUT /api/comerciales/:id` — actualizar
- `DELETE /api/comerciales/:id` — eliminar

### Matriz de Riesgos BASC
- `GET /api/matriz-riesgos` — lista con filtros (search, riesgo, completa)
- `GET /api/matriz-riesgos/:recordId` — getOrCreate (score automático)
- `PUT /api/matriz-riesgos/:recordId` — upsert scoring

Scoring: Mercancía 45% · Frecuencia 15% · Facturación 25% · TipoPersona 5% · Tiempo 5% · Capital 5%
Niveles: PENDIENTE → BAJO (>0) → MEDIO (≥3) → ALTO (≥4) → CRÍTICO (≥5)

### Gestión Documental BASC
- `GET /api/gestion-documental` — lista con filtros (search, completa, vencida)
- `GET /api/gestion-documental/:recordId` — getOrCreate con 18 documentos
- `PUT /api/gestion-documental/:recordId` — upsert docs y ciclo

18 documentos: pond_di (directo) y pond_ref (referido) — vencimiento basado en FR-001-GC + 1 año

### Preliquidador
Frontend only — sin endpoint propio. Lee cotizaciones y calcula MAX(calculado, mínima) por ítem seleccionado.

---

## Motor de autenticación

**JWT HS256** con `JWT_SECRET` compartido con `zymo-intranet`

- Token CRM: `{ id, username, role }` — expira en 8h
- SSO Token intranet: validado en `POST /api/auth/sso`
- Middleware: `authenticate` en todas las rutas privadas

---

## Motor de importación

- Librería: `ExcelJS` (backend)
- Formato: `.xlsx` — primera hoja, primera fila = headers
- Columnas reconocidas: tipo, empresa, nit, ciudad, comercialNombre, estadoProspecto, estadoCliente, fecha, observaciones, servicios, valor
- Respuesta: `{ imported: N, errors: ["Fila X: ..."] }`

## Motor de exportación

- **Excel**: `xlsx` (frontend) — exportación client-side en Prospectos, Clientes y Cotizaciones
- **PDF Cotizaciones**: `jsPDF` + `html2canvas` (frontend) — captura `htmlPreview` y genera PDF
- **Imprimir CotPublica**: `window.print()` con print CSS — modo blanco para cotización pública

---

## Conexiones

- [[ZYMO_CRM_AGENT]] — el agente consulta estos motores
- [[Mente_ZYMO_SUBAGENT]] — razona sobre los datos
- [[KPIs_Tiempos]] — datos fuente para KPIs
- [[Biblioteca_Tarifas]] — motor de tarifas
- [[Conexion_Sistema_Gerencial]] — datos que fluyen hacia arriba

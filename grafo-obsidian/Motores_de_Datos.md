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
| `Actividad` | Log de llamadas, visitas, emails |
| `Comercial` | Equipo comercial |
| `Cotizacion` | Cotizaciones con snapshot de tarifas |
| `CotNumeroCounter` | Secuencia atómica COT-001, COT-002... |
| `BibliotecaLinea` | Líneas de servicio en la Biblioteca |
| `BibliotecaGrupo` | Grupos dentro de cada línea |
| `BibliotecaItem` | Items con tarifa como string |
| `BibliotecaObs` | Observaciones predefinidas por línea |
| `CrmMeta` | Metadata del pipeline: timestamps por etapa |
| `User` | Usuarios del sistema con roles |

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
- `POST /api/records/:recordId/actividades` — registrar actividad
- `PUT /api/actividades/:id` — actualizar (incluye marcar hecho)
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

---

## Conexiones

- [[ZYMO_CRM_AGENT]] — el agente consulta estos motores
- [[Mente_ZYMO_SUBAGENT]] — razona sobre los datos
- [[KPIs_Tiempos]] — datos fuente para KPIs
- [[Biblioteca_Tarifas]] — motor de tarifas
- [[Conexion_Sistema_Gerencial]] — datos que fluyen hacia arriba

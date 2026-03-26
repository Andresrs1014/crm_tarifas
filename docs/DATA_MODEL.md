# Modelo de Datos — CRM Tarifas ZYMO
Extraído del prototipo crm_oscar.html. NO leer el HTML original.

## Servicios (constantes del sistema)
['Zona Franca', 'Depósito Aduanero', 'CEDI', 'Transporte', 'Paqueteo', 'Aduana']

## Tabla: comerciales
- id: UUID PK
- nombre: str NOT NULL
- cargo: str nullable
- email: str nullable
- tel: str nullable
- activo: bool default True
- created_at: datetime

## Tabla: records
Contiene prospectos Y clientes. El campo `tipo` los distingue.
- id: UUID PK
- tipo: str — 'prospecto' | 'cliente'
- empresa: str NOT NULL
- nit: str nullable
- ciudad: str nullable
- comercial_id: UUID FK → comerciales
- tipo_cliente: str default 'directo' — 'directo' | 'indirecto' | 'referido'
- cliente_indirecto_id: UUID FK → records (self) nullable — solo si tipo_cliente=referido
- comision: str nullable — solo si tipo_cliente=indirecto
- fecha: date NOT NULL
- proximo_seguimiento: date nullable
- observaciones: text nullable
- estado_prospecto: str nullable — 'seguimiento'|'cerrado'|'perdido'|'frio' — solo si tipo=prospecto
- estado_cliente: str nullable — 'activo'|'en-riesgo'|'inactivo' — solo si tipo=cliente
- visita: str nullable — 'no'|'si'|'virtual'|'llamada' — prospecto
- visita_cliente: str nullable — 'no'|'si'|'virtual'|'llamada' — cliente
- facturado_p: str nullable — 'no'|'si'|'parcial' — prospecto
- facturado: str nullable — 'no'|'si'|'parcial' — cliente
- valor_p: int nullable — COP total facturado prospecto
- valor: int nullable — COP total facturado cliente
- nuevo_servicio: str nullable — 'si'|'no' — cliente
- servicio_nuevo: str nullable — nombre del nuevo servicio
- servicios: JSON default [] — ['Zona Franca', 'Aduana', ...]
- facturacion_lineas: JSON default {} — {'Zona Franca': 1200000, ...}
- created_at: datetime
- updated_at: datetime

## Tabla: contactos
Un record puede tener N contactos. orden=0 es el principal.
- id: UUID PK
- record_id: UUID FK → records
- nombre: str NOT NULL
- cargo: str nullable
- telefono: str nullable
- email: str nullable
- orden: int default 0

## Tabla: actividades
Historial de acciones sobre un record.
- id: UUID PK
- record_id: UUID FK → records
- tipo: str — 'visit'|'service'|'invoice'|'note'
- descripcion: text NOT NULL
- fecha: date NOT NULL
- created_at: datetime

## Endpoints requeridos

### Comerciales
GET    /api/comerciales
POST   /api/comerciales
PUT    /api/comerciales/{id}
DELETE /api/comerciales/{id} — validar que no tenga records asociados

### Records
GET    /api/records — filtros: tipo, estado, comercial_id, search, fecha
POST   /api/records — incluye array de contactos
GET    /api/records/{id} — incluye contactos + actividades
PUT    /api/records/{id}
DELETE /api/records/{id}
POST   /api/records/{id}/actividades

## Notas importantes
- servicios y facturacion_lineas van como JSON en SQLite (no tablas separadas)
- Los contactos SÍ son tabla separada (relación 1:N)
- Las actividades SÍ son tabla separada (relación 1:N)
- cliente_indirecto_id es self-reference en la misma tabla records
- Todos los IDs son UUID generados por la app, no autoincrement
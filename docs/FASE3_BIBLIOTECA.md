# Fase 3 — Biblioteca de Servicios

## Descripción
Configuración maestra de tarifas por línea de negocio.
El usuario configura grupos, ítems y plantillas de observaciones.
Al crear una cotización, se toma esta biblioteca como base.

## Tablas

### biblioteca_lineas
- id: UUID PK
- nombre: str UNIQUE NOT NULL — 'Zona Franca'|'Depósito Aduanero'|'CEDI'|'Transporte'|'Paqueteo'|'Aduana'
- columnas: JSON default [] — columnas extra dinámicas: [{id, nombre}, ...]
- orden: int default 0

### biblioteca_grupos
- id: UUID PK
- linea_id: UUID FK → biblioteca_lineas
- nombre: str NOT NULL — ej: 'Almacenamiento', 'Manipulación'
- orden: int default 0

### biblioteca_items
- id: UUID PK
- grupo_id: UUID FK → biblioteca_grupos
- nombre: str NOT NULL — ej: 'Contenedor 20 pies'
- tarifa: str NOT NULL — como string: '559.900' o '0,36%'
- tipo_tarifa: str NOT NULL — 'moneda' | 'porcentaje'
- obs: text nullable — observación corta del ítem
- extra_cols: JSON default {} — {col_id: valor, ...}
- orden: int default 0

### biblioteca_observaciones
- id: UUID PK
- linea_id: UUID FK → biblioteca_lineas
- nombre: str NOT NULL — ej: 'Condiciones Generales Zona Franca'
- html: text NOT NULL — contenido HTML enriquecido (TipTap output)
- orden: int default 0

## Endpoints
GET    /api/biblioteca — árbol completo: lineas → grupos → items → observaciones
POST   /api/biblioteca/grupos
PUT    /api/biblioteca/grupos/{id}
DELETE /api/biblioteca/grupos/{id} — elimina también sus items
POST   /api/biblioteca/items
PUT    /api/biblioteca/items/{id}
DELETE /api/biblioteca/items/{id}
POST   /api/biblioteca/observaciones
PUT    /api/biblioteca/observaciones/{id}
DELETE /api/biblioteca/observaciones/{id}
PUT    /api/biblioteca/lineas/{id}/columnas — actualiza columnas extra

## Seed Data (ejecutar al iniciar si biblioteca está vacía)
Las 6 líneas base deben existir siempre:
['Zona Franca', 'Depósito Aduanero', 'CEDI', 'Transporte', 'Paqueteo', 'Aduana']

Zona Franca — grupos y items de ejemplo:
Grupo 'Almacenamiento':
  - Ad Valorem | 0,36% | porcentaje | Del valor CIF de la mercancía
  - Mínima aérea / LCL | 237.600 | moneda | Por documento de transporte
  - Contenedor 20 pies | 559.900 | moneda | Por contenedor
  - Contenedor 40 pies | 748.000 | moneda | Por contenedor
Grupo 'Manipulación de Mercancía':
  - Ad Valorem | 42% | porcentaje | Del peso total ingresado
  - Mínima aérea / LCL | 42.900 | moneda | Por documento de transporte
  - Contenedor 20 pies | 398.200 | moneda | Por contenedor
  - Contenedor 40 pies | 569.800 | moneda | Por contenedor

## Notas
- tarifa se guarda como VARCHAR porque puede ser '559.900' (moneda) o '0,36%' (porcentaje)
- columnas y extra_cols son JSON — columnas dinámicas que el usuario define por línea
- El GET /api/biblioteca devuelve el árbol completo en una sola llamada
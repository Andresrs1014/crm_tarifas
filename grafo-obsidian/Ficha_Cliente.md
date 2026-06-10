#modulo #seguimiento

# Ficha Cliente (SOP)

> **Tipo:** Módulo de onboarding SOP
> **Rutas:** `/fichas` (lista) · `/fichas/:recordId` (detalle)
> **Dependencias:** [[Motores_de_Datos]] · [[Actores_y_Roles]] · [[Pipeline_Prospectos]] · [[Reglas_de_Negocio]]

---

## Propósito

Formulario estructurado de onboarding (Standard Operating Procedure) que documenta toda la información operativa, comercial y de facturación necesaria para comenzar a operar con un cliente nuevo.

Se crea una ficha por cada `Record` (prospecto o cliente). La ficha se crea automáticamente al primer acceso (get-or-create).

---

## Estructura — 5 pestañas

### Tab 1: Info General
- Tipo de cliente (Directo / Intermediario / Referido)
- Manejo (Simple, Simple referenciado, Inventario, Paqueteo, Transporte local) — checkboxes múltiples
- Sector / Tipo de mercancía (20 opciones)
- Canal de comunicación
- Líneas de negocio activas (Depósito Aduanero, Zona Franca, Transporte Local, CEDI IMC) — chips toggle
- Fecha tentativa 1er proceso
- Analista de operaciones (CRUD inline — tabla `analistas`)
- Observaciones generales

### Tab 2: Contactos
- Matriz de contactos editable (cargo, tipo, nombre, email, tel, cel, aviso de cobro)
- Si tipo = Intermediario o Referido: sección "Cliente que refiere" (empresa, NIT, dirección, tel)

### Tab 3: Facturación
- Forma de pago, fecha cierre facturación, facturar a, buzón electrónico
- Pago realizado por, teléfono contacto
- Tipo de tarifa (Neta / Venta), aplica comisión, aplica cobro seguro
- Conteo de pallet (Logimat / IMCC Cargo), rotación
- **Tipo de almacenamiento** — 3 columnas: LOGIMAT, IMCC CARGO, IMC DEPÓSITO (1er mes / 2do mes)
- **Tipo de facturación** — 3 columnas
- **Forma de facturación / Cantidad de facturas** — 3 columnas con opciones específicas por empresa

### Tab 4: Operación
- Tipo de producto, textil, reempaque, embalaje, control de inventario
- Nacionaliza, proceso especial + descripción, manipulación especial
- **Despachos:** detalle general, salidas parciales, rotación de mercancía, agencia de aduanas, coordinador
- **Transporte:** tipo de entrega, horarios, escolta, tipología de vehículo, citas, cargue/descargue

### Tab 5: Kick Off
- Tabla de asistentes (cargo + contacto) — editable
- Compromisos fijos (3 filas: Operaciones, Facturación, Comercial → Inmediato)
- Observaciones de la reunión
- Estado de la ficha

---

## Cálculo de progreso (`pct`)

Se evalúan 22 campos obligatorios distribuidos en los 5 tabs. El porcentaje es `campos_llenos / 22 * 100`.

**Campos requeridos:** tipoCliente, manejo (≥1), sector, canal, fechaProceso, analistaId, obsGeneral, formaPago, facturarA, buzon, tipoTarifa, comision, seguro, tipoProducto, embalaje, controlInv, nacionaliza, manipulacion, despachos, entregaTipo, horarios, contactos (≥1).

---

## Estados de la ficha

| Estado | Badge | Descripción |
|--------|-------|-------------|
| `pendiente` | ⏳ gris | Sin completar |
| `en_proceso` | 🔄 dorado | Parcialmente diligenciada |
| `completada` | ✅ verde | Todos los campos requeridos llenos |

---

## Modelo de datos

### Tabla `fichas_cliente`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `recordId` | UUID unique | FK → records |
| `estado` | String | `pendiente` / `en_proceso` / `completada` |
| `pct` | Int | Porcentaje de completitud (0–100) |
| `data` | JSON | Todos los campos del formulario |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

### Tabla `analistas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `nombre` | String | Nombre del analista de operaciones |
| `email` | String? | Email |
| `tel` | String? | Teléfono |

---

## Endpoints

- `GET /api/fichas` — lista con filtros (estado, comercialId)
- `GET /api/fichas/record/:recordId` — get-or-create ficha por record
- `PUT /api/fichas/:id` — actualizar estado, pct y data
- `GET /api/fichas/analistas` — lista analistas
- `POST /api/fichas/analistas` — crear analista
- `DELETE /api/fichas/analistas/:id` — eliminar analista

---

## Conexiones

- [[Pipeline_Prospectos]] — la ficha se completa cuando el prospecto avanza a `creacion_sop`
- [[Actores_y_Roles]] — analista de operaciones es un actor del proceso
- [[Motores_de_Datos]] — tablas fichas_cliente y analistas
- [[Reglas_de_Negocio]] — el Kick Off es obligatorio antes de comenzar operación

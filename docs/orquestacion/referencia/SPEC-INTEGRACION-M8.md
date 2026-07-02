# SPEC-INTEGRACION-M8 — Especificación backend B1–B6

**Autor:** Claude C17 · **Fecha:** 2026-07-01  
**Para:** Cursor (B1–B6)  
**Fuente:** `REPORTE-MINIMAX-M8-CONEXIONES.md` hallazgos C1–C7  
**Restricciones:** No tocar Docker, `.env`. Usar `prisma.$transaction` para batches. CORS solo en prod.

---

## Mapa C → B

| ID M8 | Hallazgo M8 | ID spec | Riesgo |
|-------|------------|---------|--------|
| C1 | Endpoint duplicado `/api/actividades/vencidas` | B1 | ALTO |
| C2 | `convertProspectToCliente` no crea `GestionDocumental` | B2 | ALTO |
| C3 | `createRecord` no crea `CrmMeta` para prospectos | B3 | ALTO |
| C4 | Aprobar cotización no avanza `Record.estadoProspecto` | B4 | ALTO |
| C5 | Import masivo sin CrmMeta ni actividades automáticas | B5 | MEDIO |
| C6 | `actividad_por_comercial` siempre vacío en Dashboard | B6 | MEDIO |

---

## B1 — Eliminar endpoint duplicado `/api/actividades/vencidas`

**Archivos:** `backend/src/app.ts:40` · `backend/src/modules/crm/crm.routes.ts:158`

### Comportamiento HTML

El HTML no distinguía entre `/actividades/vencidas` y `/crm/actividades/vencidas` — era un solo handler en localStorage.

### Comportamiento React actual

Dos handlers distintos responden al mismo path `/api/actividades/vencidas`:
- `actividades.routes.ts:54` — montado via `app.use('/api', actividadesRoutes)`
- `crm.routes.ts:158` — define `GET /api/crm/actividades/vencidas`

Express resuelve el primero que coincida — el segundo puede quedar muerto o generar conflictos en algunas versiones de Express.

### Fix propuesto

```typescript
// crm.routes.ts: ELIMINAR la línea ~158:
// router.get('/actividades/vencidas', ...)  ← BORRAR

// actividades.routes.ts conservar:
// router.get('/vencidas', ...) ← CONSERVAR (este es el canónico)
```

Verificar que `CalendarioVisitas.tsx` llama `/api/actividades/vencidas` y no `/api/crm/actividades/vencidas`.

### Criterios de aceptación

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/actividades/vencidas
# → 200 con array de actividades

curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/crm/actividades/vencidas
# → 404 (ruta eliminada)
```

**Riesgo:** BAJO — solo eliminar una ruta duplicada. No afecta datos.

---

## B2 — `convertProspectToCliente` debe crear `GestionDocumental`

**Archivo:** `backend/src/modules/records/records.service.ts` (función `convertProspectToCliente`, ~línea 387)

### Comportamiento HTML

Al convertir prospecto → cliente, el HTML inicializaba automáticamente la carpeta de documentos BASC con 18 documentos predeterminados.

### Comportamiento React actual

```typescript
// Actual (records.service.ts ~L387):
await getOrCreateMatriz(id);     // ✅ crea MatrizRiesgo
// ← FALTA: await getOrCreateGD(id)
```

Clientes convertidos aparecen en Gestión Documental sin registro → error al intentar editar documentos → el usuario ve "sin datos" en BASC compliance.

### Fix propuesto

```typescript
// records.service.ts — dentro de convertProspectToCliente, tras getOrCreateMatriz:
import { getOrCreateGD } from '../gestion-documental/gestion-documental.service';

// ...
await getOrCreateMatriz(id);
await getOrCreateGD(id);     // ← AÑADIR esta línea
```

`getOrCreateGD` ya existe en `gestion-documental.service.ts` — solo falta llamarla.

### Criterios de aceptación

```bash
# 1. Crear un prospecto
# 2. Convertir a cliente via POST /api/records/:id/convert-to-cliente
# 3. Verificar:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/gestion-documental/:recordId
# → 200 con objeto GD (no 404 ni vacío)
# → debe contener los 18 docs predefinidos (FR-001, est_fin, cam_com, rut, ...)
```

**Riesgo:** BAJO — añadir una llamada a función ya existente. No rompe nada existente.

---

## B3 — `createRecord` debe crear `CrmMeta` para prospectos

**Archivo:** `backend/src/modules/records/records.service.ts` (función `createRecord`, ~líneas 132-206)

### Comportamiento HTML

Al crear un prospecto, el HTML lo inicializaba directamente en el Kanban CRM con `estadoPipeline: 'prospecto'`.

### Comportamiento React actual

`createRecord` con `tipo: 'prospecto'` crea `Record` + `Contacto(s)` + `Actividad(es)`, pero NO crea `CrmMeta`. El CRM Kanban agrupa por `CrmMeta.estadoPipeline` (con LEFT JOIN) — si es null, el prospecto queda en un limbo o en la columna "prospecto" solo si hay lógica de fallback.

### Fix propuesto

```typescript
// records.service.ts — dentro de createRecord, después de prisma.record.create():
const created = await prisma.record.create({ data: { ... } });

if (created.tipo === 'prospecto') {
  await prisma.crmMeta.create({
    data: {
      recordId: created.id,
      estadoPipeline: 'prospecto',
    },
  });
}
```

### Criterios de aceptación

```bash
# 1. POST /api/records { tipo: 'prospecto', empresa: 'Test B3', comercialId: '...' }
# 2. GET /api/crm/pipeline
# → el nuevo prospecto aparece en columna 'prospecto' inmediatamente
# 3. GET /api/crm/:id/meta
# → { estadoPipeline: 'prospecto', tiempos: {} }
```

**Riesgo:** MEDIO — crear `CrmMeta` en cada nuevo prospecto. Prospectos existentes creados antes de este fix NO tendrán `CrmMeta` hasta que se mueva su estado (comportamiento actual). Considerar script de backfill en migration.

---

## B4 — Aprobar cotización debe avanzar `estadoProspecto` en Record

**Archivo:** `backend/src/modules/cotizaciones/cotizaciones.service.ts` (función `updateCotizacion`)

### Comportamiento HTML

En el HTML, al cambiar estado de cotización a `'aprobada'`, el sistema avanzaba automáticamente el estado del prospecto asociado a `'aceptacion_propuesta'` en el Kanban.

### Comportamiento React actual

`PUT /api/cotizaciones/:id { estado: 'aprobada' }` solo actualiza `Cotizacion.estado`. No hay side-effect sobre `Record`.

### Fix propuesto

```typescript
// cotizaciones.service.ts — updateCotizacion:
async function updateCotizacion(id: string, data: UpdateCotizacionDto) {
  const updated = await prisma.cotizacion.update({ where: { id }, data });

  // Side-effect: aprobar cotización avanza estadoProspecto
  if (data.estado === 'aprobada' && updated.recordId) {
    await prisma.record.update({
      where: { id: updated.recordId },
      data: { estadoProspecto: 'aceptacion_propuesta' },
    });
    // También actualizar CrmMeta si existe:
    await prisma.crmMeta.upsert({
      where: { recordId: updated.recordId },
      create: { recordId: updated.recordId, estadoPipeline: 'aceptacion_propuesta' },
      update: { estadoPipeline: 'aceptacion_propuesta' },
    });
  }

  return updated;
}
```

> **Nota de negocio:** Confirmar con el humano/Cursor si el estado que debe avanzar es `'aceptacion_propuesta'` u otro. La interpretación viene del grafo `Pipeline_Cotizaciones.md`.

### Criterios de aceptación

```bash
# 1. Crear cotización vinculada a un prospecto (recordId no nulo)
# 2. PUT /api/cotizaciones/:id { estado: 'aprobada' }
# 3. GET /api/records/:recordId
# → estadoProspecto: 'aceptacion_propuesta'
# 4. GET /api/crm/pipeline
# → prospecto aparece en columna 'aceptacion_propuesta'
```

**Riesgo:** MEDIO — side-effect nuevo en un endpoint existente. Si `recordId` es null (cotización sin vínculo), no hay efecto. Requiere prueba de regresión en cotizaciones existentes.

---

## B5 — Import masivo debe crear CrmMeta y actividades automáticas

**Archivo:** `backend/src/modules/records/records.import.ts`

### Comportamiento HTML

El import masivo del HTML inicializaba cada registro como si hubiera sido creado manualmente — con actividad inicial de tipo "seguimiento".

### Comportamiento React actual

`POST /api/records/import` procesa un Excel y crea `Record(s)` en batch, sin crear `CrmMeta` ni `Actividad` inicial. Los prospectos importados no aparecen en CRM Kanban.

### Fix propuesto

```typescript
// records.import.ts — en el loop de creación de cada record:
// Opción A: reusar createRecord() que ya tiene los side-effects de B3
// Opción B: añadir inline CrmMeta.create + Actividad.create por cada record creado

// RECOMENDADO — Opción A + transacción:
await prisma.$transaction(async (tx) => {
  for (const row of rows) {
    const record = await createRecord(row, tx); // reusar función ya existente
  }
});
```

Si `createRecord` acepta un cliente Prisma (tx) como parámetro, el batch entero se puede envolver en una transacción → atomicidad (M12 de M8 también resuelto).

### Criterios de aceptación

```bash
# 1. POST /api/records/import con Excel de 3 prospectos
# 2. GET /api/crm/pipeline
# → los 3 aparecen en columna 'prospecto'
# 3. GET /api/records?tipo=prospecto
# → 3 registros nuevos con actividad inicial
# 4. Si el Excel tiene un error en fila 3, ninguna de las 3 filas debe guardarse (atomicidad)
```

**Riesgo:** MEDIO — cambio en el flujo de import. El wrap en `$transaction` puede afectar performance en imports grandes (>100 registros). Aceptable para el volumen actual.

---

## B6 — `actividad_por_comercial` en Dashboard

**Archivo:** `backend/src/modules/dashboard/dashboard.service.ts` (~línea 127)

### Comportamiento HTML

El Dashboard HTML mostraba un KPI de actividades por comercial (cuántas llamadas/visitas/emails hizo cada uno en el período).

### Comportamiento React actual

```typescript
// dashboard.service.ts ~L127 — actualmente:
actividad_por_comercial: [],  // ← siempre vacío
```

El frontend puede estar esperando este array para renderizar un widget de ranking de actividad.

### Fix propuesto

```typescript
// dashboard.service.ts — calcular desde tabla Actividad:
const actividadPorComercial = await prisma.actividad.groupBy({
  by: ['recordId'],
  _count: { id: true },
  where: {
    fecha: { gte: startDate, lte: endDate },
    hecho: true,
  },
});

// Cruzar con Record.comercialId para agrupar por comercial:
const byComercial = await prisma.$queryRaw`
  SELECT c.nombre, COUNT(a.id) as total
  FROM "Actividad" a
  JOIN "Record" r ON a."recordId" = r.id
  JOIN "Comercial" c ON r."comercialId" = c.id
  WHERE a.fecha >= ${startDate} AND a.fecha <= ${endDate}
  GROUP BY c.nombre
  ORDER BY total DESC
`;

return { ..., actividad_por_comercial: byComercial };
```

### Criterios de aceptación

```bash
# GET /api/dashboard?comercialId=all
# → actividad_por_comercial: [{ nombre: 'Oscar Burgos', total: 15 }, ...]
# No debe ser [] si hay actividades registradas en el período
```

**Riesgo:** BAJO — cambio solo en la query de dashboard. No afecta otros módulos.

---

## Orden de implementación recomendado

| Orden | ID | Razón |
|-------|----|-------|
| 1 | B1 | Eliminar endpoint duplicado — riesgo de side-effects en Express |
| 2 | B2 | Conversión prospecto→cliente rota — impacto directo en BASC compliance |
| 3 | B3 | Prospectos nuevos no visibles en CRM — flujo comercial roto |
| 4 | B4 | Aprobar cotización sin avanzar pipeline — gap funcional clave |
| 5 | B5 | Import masivo — depende de B3 (reusar createRecord) |
| 6 | B6 | Dashboard KPI — bajo impacto comparado con los anteriores |

---

## Verificación final post-B1–B6

```bash
# Flujo completo Lead → Cliente activo (todos los side-effects):
# 1. POST /api/records { tipo: 'prospecto' }            → CrmMeta creado (B3)
# 2. GET /api/crm/pipeline                              → aparece en 'prospecto'
# 3. PUT /api/cotizaciones/:id { estado: 'aprobada' }   → estadoProspecto avanza (B4)
# 4. POST /api/records/:id/convert-to-cliente           → GD creada (B2)
# 5. GET /api/gestion-documental/:recordId              → 200 con docs
# 6. GET /api/actividades/vencidas                      → no duplicado (B1)
# 7. GET /api/dashboard                                 → actividad_por_comercial poblada (B6)
```
